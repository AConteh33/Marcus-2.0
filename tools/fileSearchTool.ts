import type { Tool } from "./tool";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import { processTerminalOutput, fuzzyMatchWithScore, searchCache } from "../utils/fileSearch";

export class FileSearchTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'searchFiles',
      description: 'Search for files using pattern matching, fuzzy matching, and recursive directory traversal. Can find files without knowing the exact path or name. Returns complete file paths that can be used to locate files before opening them.',
      parameters: {
        type: Type.OBJECT,
        description: 'Parameters for file search',
        properties: {
          searchTerm: {
            type: Type.STRING,
            description: 'The search term to look for (supports wildcards like * and ?)'
          },
          searchPath: {
            type: Type.STRING,
            description: 'The directory path to search in (defaults to current directory)'
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
          }
        },
        required: ['searchTerm']
      }
    };
  }

  async execute(args: {
    searchTerm: string;
    searchPath?: string;
    caseSensitive?: boolean;
    recursive?: boolean;
    maxResults?: number;
    fileExtensions?: string[];
    excludePatterns?: string[];
  }): Promise<string> {
    try {
      const {
        searchTerm,
        searchPath = '.',
        caseSensitive = false,
        recursive = true,
        maxResults = 50,
        fileExtensions,
        excludePatterns = []
      } = args;

      // Validate inputs
      if (!searchTerm || typeof searchTerm !== 'string') {
        return 'Error: searchTerm is required and must be a string';
      }

      // Normalize file extensions to include the dot
      const normalizedExtensions = fileExtensions?.map(ext =>
        ext.startsWith('.') ? ext : `.${ext}`
      );

      // Execute the search command via the terminal tool
      const toolController = (this as any).toolController; // Access to tool controller if available

      if (toolController) {
        // Determine the appropriate command based on the platform (this will be done by the terminal tool)
        // For now, we'll construct a command that works cross-platform
        let searchCommand = '';

        // Use the executeTerminalCommand tool to perform the search
        // This allows the terminal tool to handle platform differences
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
              // Use -iname for case-insensitive search which is more user-friendly
              findCmd = `find "${searchPath}" -type f -iname "*${searchTerm}*" 2>/dev/null`;
            }

            searchCommand = findCmd;
          } else {
            // If search term contains wildcards, use it directly in find command
            if (searchTerm.includes('*') || searchTerm.includes('?')) {
              searchCommand = `find "${searchPath}" -type f -name "${searchTerm}" 2>/dev/null`;
            } else {
              // Use -iname for case-insensitive search which is more user-friendly and faster for fuzzy matching
              searchCommand = `find "${searchPath}" -type f -iname "*${searchTerm}*" 2>/dev/null`;
            }
          }
        } else {
          // Non-recursive search
          searchCommand = `ls -la "${searchPath}" 2>/dev/null | grep -i "${searchTerm}"`;
        }

        const result = await toolController.executeTool('executeTerminalCommand', { command: searchCommand });

        // Process the results using the utility function
        if (result && typeof result === 'string') {
          // Create a cache key for this search
          const cacheKey = `${searchTerm}_${searchPath}_${recursive}_${JSON.stringify(fileExtensions)}`;

          // Check if we have cached results for this search
          let cachedResults = searchCache.get(cacheKey);
          if (!cachedResults) {
            // Use the utility function to process terminal output
            const allFiles = processTerminalOutput(result, [], Number.MAX_SAFE_INTEGER); // Get all files first

            // Apply fuzzy matching to find the best matches
            const fuzzyMatches = allFiles
              .map(file => ({
                file,
                score: fuzzyMatchWithScore(file.toLowerCase(), searchTerm.toLowerCase())
              }))
              .filter(item => item.score > 0) // Only include matches with a positive score
              .sort((a, b) => b.score - a.score) // Sort by score descending
              .slice(0, maxResults) // Limit to maxResults
              .map(item => item.file); // Extract just the file paths

            // Also include exact substring matches from the original processing
            const exactMatches = processTerminalOutput(result, excludePatterns, maxResults);

            // Combine fuzzy matches and exact matches, removing duplicates
            const combinedMatches = [...new Set([...fuzzyMatches, ...exactMatches])].slice(0, maxResults);

            // Cache the results
            searchCache.set(cacheKey, combinedMatches);
            cachedResults = combinedMatches;
          }

          if (cachedResults.length === 0) {
            return `No files found matching "${searchTerm}" in "${searchPath}". Try adjusting your search term or path.`;
          }

          // Format the results to clearly show each file with its path
          let resultMessage = `Found ${cachedResults.length} file(s) matching "${searchTerm}" (using fuzzy matching):\n`;
          for (let i = 0; i < cachedResults.length; i++) {
            resultMessage += `\n${i + 1}. ${cachedResults[i]}`;
          }

          return resultMessage;
        } else {
          return `No files found matching "${searchTerm}" in "${searchPath}".`;
        }
      } else {
        // Fallback: return a description of the search that would be performed
        return `Search prepared: Searching for files with pattern: "${searchTerm}", in path: "${searchPath}", recursive: ${recursive}\n(Actual execution requires access to terminal tools)`;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('File search error:', errorMessage);
      return `Failed to search for files: ${errorMessage}`;
    }
  }
}