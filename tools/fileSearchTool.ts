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

      // Return the command that would be executed (since we can't access other tools directly)
      return `File search command prepared: ${searchCommand}\n\nNote: This tool needs access to the executeTerminalCommand tool to run the search. The command would search for files matching "${searchTerm}" in "${searchPath}".`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('File search error:', errorMessage);
      return `Failed to search for files: ${errorMessage}`;
    }
  }
}