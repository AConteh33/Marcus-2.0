import type { Tool } from "./tool";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import { processTerminalOutput, fuzzyMatchWithScore, searchCache } from "../utils/fileSearch";

export class EnhancedFileSearchTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'searchFilesEnhanced',
      description: 'Enhanced file search with intelligent fallback to Downloads and Documents folders. ALWAYS ask for confirmation before searching. Searches current directory first, then falls back to Downloads and Documents if no results found. Uses terminal commands for maximum speed and accuracy.',
      parameters: {
        type: Type.OBJECT,
        description: 'Parameters for enhanced file search',
        properties: {
          searchTerm: {
            type: Type.STRING,
            description: 'The search term to look for (supports wildcards like * and ?)'
          },
          searchPath: {
            type: Type.STRING,
            description: 'The directory path to search in (defaults to current directory, will auto-expand to Downloads and Documents if needed)'
          },
          caseSensitive: {
            type: Type.BOOLEAN,
            description: 'Whether the search should be case sensitive (default: false)'
          },
          recursive: {
            type: Type.BOOLEAN,
            description: 'Whether to search recursively in subdirectories (default: true)'
          },
          maxResults: {
            type: Type.NUMBER,
            description: 'Maximum number of results to return (default: 50)'
          },
          fileExtensions: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: 'Array of file extensions to filter by (e.g., ["ts", "js", "tsx"])'
          },
          excludePatterns: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: 'Array of patterns to exclude from search results'
          },
          enableFallback: {
            type: Type.BOOLEAN,
            description: 'Enable fallback search in Downloads and Documents folders if initial search fails (default: true)'
          }
        },
        required: ['searchTerm']
      }
    };
  }

  private async getMainUserFolders(): Promise<string[]> {
    const toolController = (this as any).toolController;
    if (!toolController) return [];

    try {
      // Get home directory
      const homeResult = await toolController.executeTool('executeTerminalCommand', { 
        command: 'echo $HOME' 
      });
      
      if (!homeResult || typeof homeResult !== 'string') return [];
      
      const homeDir = homeResult.trim();
      const mainFolders = [
        `${homeDir}/Downloads`,
        `${homeDir}/Documents`
      ];

      // Check which folders actually exist
      const existingFolders: string[] = [];
      for (const folder of mainFolders) {
        const checkResult = await toolController.executeTool('executeTerminalCommand', { 
          command: `test -d "${folder}" && echo "exists"` 
        });
        if (checkResult && checkResult.includes('exists')) {
          existingFolders.push(folder);
        }
      }

      return existingFolders;
    } catch (error) {
      console.error('Error getting main folders:', error);
      return [];
    }
  }

  private async executeSearch(
    toolController: any,
    searchTerm: string,
    searchPath: string,
    recursive: boolean,
    normalizedExtensions: string[] | undefined,
    caseSensitive: boolean
  ): Promise<string> {
    let searchCommand = '';

    if (recursive) {
      if (normalizedExtensions && normalizedExtensions.length > 0) {
        // Build find command with extension filtering
        let findCmd = `find "${searchPath}" -type f \\( `;

        normalizedExtensions.forEach((ext, index) => {
          if (index > 0) findCmd += ' -o ';
          findCmd += `-name "*${ext}"`;
        });

        findCmd += ` \\) 2>/dev/null`;

        // If the search term is not a wildcard, add name filter for better performance
        if (!searchTerm.includes('*') && !searchTerm.includes('?')) {
          const nameFlag = caseSensitive ? '-name' : '-iname';
          findCmd = `find "${searchPath}" -type f ${nameFlag} "*${searchTerm}*" 2>/dev/null`;
        }

        searchCommand = findCmd;
      } else {
        // If search term contains wildcards, use it directly in find command
        if (searchTerm.includes('*') || searchTerm.includes('?')) {
          searchCommand = `find "${searchPath}" -type f -name "${searchTerm}" 2>/dev/null`;
        } else {
          // Use -iname for case-insensitive search which is more user-friendly and faster for fuzzy matching
          const nameFlag = caseSensitive ? '-name' : '-iname';
          searchCommand = `find "${searchPath}" -type f ${nameFlag} "*${searchTerm}*" 2>/dev/null`;
        }
      }
    } else {
      // Non-recursive search
      const grepFlag = caseSensitive ? '' : 'i';
      searchCommand = `ls -la "${searchPath}" 2>/dev/null | grep -${grepFlag} "${searchTerm}"`;
    }

    const result = await toolController.executeTool('executeTerminalCommand', { command: searchCommand });
    return result || '';
  }

  async execute(args: {
    searchTerm: string;
    searchPath?: string;
    caseSensitive?: boolean;
    recursive?: boolean;
    maxResults?: number;
    fileExtensions?: string[];
    excludePatterns?: string[];
    enableFallback?: boolean;
  }): Promise<string> {
    try {
      const {
        searchTerm,
        searchPath = '.',
        caseSensitive = false,
        recursive = true,
        maxResults = 50,
        fileExtensions,
        excludePatterns = [],
        enableFallback = true
      } = args;

      // Validate inputs
      if (!searchTerm || typeof searchTerm !== 'string') {
        return 'Error: searchTerm is required and must be a string';
      }

      // Normalize file extensions to include the dot
      const normalizedExtensions = fileExtensions?.map(ext =>
        ext.startsWith('.') ? ext : `.${ext}`
      );

      const toolController = (this as any).toolController;
      if (!toolController) {
        return 'Error: Tool controller not available';
      }

      // Step 1: Search in the specified path first
      const initialResult = await this.executeSearch(
        toolController,
        searchTerm,
        searchPath,
        recursive,
        normalizedExtensions,
        caseSensitive
      );

      // Process initial results
      if (initialResult && typeof initialResult === 'string') {
        const cacheKey = `${searchTerm}_${searchPath}_${recursive}_${JSON.stringify(fileExtensions)}`;
        
        let cachedResults = searchCache.get(cacheKey);
        if (!cachedResults) {
          const allFiles = processTerminalOutput(initialResult, [], Number.MAX_SAFE_INTEGER);

          // Apply fuzzy matching to find the best matches
          const fuzzyMatches = allFiles
            .map(file => ({
              file,
              score: fuzzyMatchWithScore(file.toLowerCase(), searchTerm.toLowerCase())
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(item => item.file);

          const exactMatches = processTerminalOutput(initialResult, excludePatterns, maxResults);
          const combinedMatches = [...new Set([...fuzzyMatches, ...exactMatches])].slice(0, maxResults);

          searchCache.set(cacheKey, combinedMatches);
          cachedResults = combinedMatches;
        }

        // If we found results in the initial search, return them
        if (cachedResults.length > 0) {
          let resultMessage = `Found ${cachedResults.length} file(s) matching "${searchTerm}" in "${searchPath}":\n`;
          for (let i = 0; i < cachedResults.length; i++) {
            resultMessage += `\n${i + 1}. ${cachedResults[i]}`;
          }
          return resultMessage;
        }
      }

      // Step 2: If no results and fallback is enabled, search in main user folders
      if (enableFallback) {
        const mainFolders = await this.getMainUserFolders();
        
        if (mainFolders.length > 0) {
          let allFallbackResults: string[] = [];
          let searchSummary = '';

          for (const folder of mainFolders) {
            const folderResult = await this.executeSearch(
              toolController,
              searchTerm,
              folder,
              recursive,
              normalizedExtensions,
              caseSensitive
            );

            if (folderResult && typeof folderResult === 'string') {
              const folderFiles = processTerminalOutput(folderResult, excludePatterns, maxResults);
              
              if (folderFiles.length > 0) {
                allFallbackResults = [...allFallbackResults, ...folderFiles];
                searchSummary += `\n- ${folder}: ${folderFiles.length} files`;
              }
            }
          }

          // Remove duplicates and limit results
          const uniqueResults = [...new Set(allFallbackResults)]
            .slice(0, maxResults);

          if (uniqueResults.length > 0) {
            let resultMessage = `Found ${uniqueResults.length} file(s) matching "${searchTerm}" in Downloads/Documents:${searchSummary}\n\nResults:\n`;
            for (let i = 0; i < uniqueResults.length; i++) {
              resultMessage += `\n${i + 1}. ${uniqueResults[i]}`;
            }
            return resultMessage;
          }
        }
      }

      return `No files found matching "${searchTerm}". Searched in "${searchPath}"${enableFallback ? ' and Downloads/Documents folders' : ''}. Try adjusting your search term or check if the file exists.`;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Enhanced file search error:', errorMessage);
      return `Failed to search for files: ${errorMessage}`;
    }
  }
}
