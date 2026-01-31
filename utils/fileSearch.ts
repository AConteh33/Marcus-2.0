/**
 * Utility functions for advanced file searching with pattern matching
 */

/**
 * Searches for files using pattern matching, fuzzy matching, and recursive directory traversal
 * @param searchTerm The search term to look for (supports wildcards and partial matches)
 * @param searchPath The directory path to search in (defaults to current directory)
 * @param options Additional search options
 * @returns Array of matching file paths
 */
export async function searchFiles(
  searchTerm: string,
  searchPath: string = '.',
  options: {
    caseSensitive?: boolean;
    recursive?: boolean;
    maxResults?: number;
    fileExtensions?: string[]; // e.g., ['.ts', '.js', '.tsx']
    excludePatterns?: string[]; // Patterns to exclude from search
  } = {}
): Promise<string[]> {
  const {
    caseSensitive = false,
    recursive = true,
    maxResults = 50,
    fileExtensions,
    excludePatterns = []
  } = options;

  // Normalize the search term
  const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  // Prepare terminal command to search for files
  let searchCommand = '';

  if (process.platform === 'win32') {
    // Windows command
    if (recursive) {
      if (fileExtensions && fileExtensions.length > 0) {
        // Search with specific file extensions
        const extFilter = fileExtensions.map(ext => `| findstr /I "\\${ext}$"`).join('');
        searchCommand = `dir /s /b "${searchPath}" ${extFilter} 2>nul | findstr /I "${normalizedSearchTerm}"`;
      } else {
        searchCommand = `dir /s /b "${searchPath}\\*${normalizedSearchTerm}*" 2>nul`;
      }
    } else {
      searchCommand = `dir "${searchPath}\\*${normalizedSearchTerm}*" /b 2>nul`;
    }
  } else {
    // Unix-like systems (macOS, Linux)
    if (recursive) {
      if (fileExtensions && fileExtensions.length > 0) {
        // Search with specific file extensions
        const extensionFilter = fileExtensions
          .map(ext => `-name "*.${ext.replace('.', '')}"`)
          .join(' -o -name ');

        // If we also want to match the search term in the filename
        searchCommand = `find "${searchPath}" \\( -name "*${normalizedSearchTerm}*" \\) -type f 2>/dev/null | grep -i "${normalizedSearchTerm}"`;

        // If we have specific extensions to filter
        if (fileExtensions.length > 0) {
          const extPart = fileExtensions
            .map(ext => `.*\\${ext.replace('.', '\\.')}$`)
            .join('\\|');
          searchCommand += ` | grep -E "(${extPart})"`;
        }
      } else {
        searchCommand = `find "${searchPath}" -type f -name "*${normalizedSearchTerm}*" 2>/dev/null`;
      }
    } else {
      searchCommand = `ls -la "${searchPath}" | grep -i "${normalizedSearchTerm}" 2>/dev/null`;
    }
  }

  try {
    // Return the command to be executed by the tool
    return executeFileSearch(searchCommand, normalizedSearchTerm, maxResults, excludePatterns, fileExtensions);
  } catch (error) {
    console.error('Error in searchFiles:', error);
    return [];
  }
}

/**
 * Processes raw terminal output to extract file paths
 */
export function processTerminalOutput(output: string, excludePatterns: string[] = [], maxResults: number = 50): string[] {
  // Split the output by newlines
  const rawLines = output.split('\n');

  // Filter out empty lines and trim whitespace
  let filePaths = rawLines
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Apply exclude patterns
  if (excludePatterns.length > 0) {
    filePaths = filePaths.filter(path =>
      !excludePatterns.some(pattern =>
        path.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  }

  // Limit results
  return filePaths.slice(0, maxResults);
}

/**
 * Alternative search function that works with the terminal tool directly
 */
export async function executeFileSearch(
  searchCommand: string,
  searchTerm: string,
  maxResults: number = 50,
  excludePatterns: string[] = [],
  fileExtensions?: string[]
): Promise<string[]> {
  // This function would be called from within the tool that has access to terminal execution
  // For now, we'll simulate the search functionality

  // In the actual tool implementation, this would execute the terminal command
  // and process the results

  // For simulation purposes, returning empty array
  // The real implementation will be in the tool
  return [];
}

/**
 * Performs fuzzy matching with higher priority scoring
 */
export function fuzzyMatchWithScore(haystack: string, needle: string, caseSensitive: boolean = false): number {
  if (!caseSensitive) {
    haystack = haystack.toLowerCase();
    needle = needle.toLowerCase();
  }

  // If exact match, return highest score
  if (haystack === needle) return 100;

  // If haystack contains the needle as substring, return high score
  if (haystack.includes(needle)) return 90;

  // Check for common patterns that indicate a good match
  // Score based on consecutive letter matches and word boundaries
  let score = 0;
  let consecutiveMatches = 0;
  let wordBoundaryMatches = 0;

  let j = 0;
  for (let i = 0; i < needle.length && j < haystack.length; i++) {
    const needleChar = needle[i];
    let found = false;

    // Look for the character in the remaining part of haystack
    while (j < haystack.length) {
      const haystackChar = haystack[j];

      if (needleChar === haystackChar) {
        // Bonus for matches at word boundaries (after spaces, underscores, hyphens, dots)
        if (j === 0 || /[\s_\-\.\/\\]/.test(haystack[j - 1])) {
          wordBoundaryMatches++;
        }

        // Bonus for consecutive matches
        consecutiveMatches++;
        score += 10 + consecutiveMatches; // Increasing bonus for consecutive matches

        j++; // Move to next character in haystack
        found = true;
        break;
      } else {
        // Reset consecutive counter when there's a gap
        consecutiveMatches = 0;
        j++;
      }
    }

    if (!found) {
      // Reduce score if we couldn't find the character
      score = Math.max(0, score - 5);
    }
  }

  // Calculate a base score based on how much of the needle was matched
  const matchPercentage = (score > 0) ? score / needle.length : 0;

  // Combine different scoring factors
  const finalScore = Math.min(100, Math.floor(score + (matchPercentage * 20) + (wordBoundaryMatches * 15)));

  return finalScore;
}

/**
 * Cache for storing recent search results
 */
class SearchCache {
  private cache: Map<string, { results: string[], timestamp: number }> = new Map();
  private readonly ttl: number = 5 * 60 * 1000; // 5 minutes TTL

  get(key: string): string[] | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.results;
    } else {
      // Remove expired entry
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }
  }

  set(key: string, results: string[]): void {
    this.cache.set(key, { results, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const searchCache = new SearchCache();

/**
 * Performs fuzzy matching between a search term and a filename/path
 */
export function fuzzyMatch(haystack: string, needle: string, caseSensitive: boolean = false): boolean {
  if (!caseSensitive) {
    haystack = haystack.toLowerCase();
    needle = needle.toLowerCase();
  }

  // Split the needle by common separators to allow partial matching
  const needleParts = needle.split(/[\s_\-\.]/).filter(part => part.length > 0);

  if (needleParts.length === 0) return true;

  // Check if all parts of the needle appear in the haystack in order
  let currentIndex = 0;
  for (const part of needleParts) {
    const foundIndex = haystack.indexOf(part, currentIndex);
    if (foundIndex === -1) {
      return false;
    }
    currentIndex = foundIndex + part.length;
  }

  return true;
}

/**
 * Converts wildcard pattern to RegExp
 */
export function wildcardToRegExp(pattern: string): RegExp {
  // Escape special regex characters except for * and ?
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${escapedPattern}$`, 'i'); // Case insensitive by default
}

/**
 * Matches a string against a wildcard pattern
 */
export function matchWildcard(input: string, pattern: string): boolean {
  const regExp = wildcardToRegExp(pattern);
  return regExp.test(input);
}

/**
 * Advanced pattern matching that supports wildcards, fuzzy matching, and partial matches
 */
export function advancedMatch(input: string, pattern: string, caseSensitive: boolean = false): boolean {
  // If pattern contains wildcards (* or ?), use wildcard matching
  if (pattern.includes('*') || pattern.includes('?')) {
    return matchWildcard(input, pattern);
  }

  // Otherwise, use fuzzy matching
  return fuzzyMatch(input, pattern, caseSensitive);
}

/**
 * Checks if a file path matches any of the exclude patterns
 */
export function matchesExcludePattern(filePath: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    // Simple pattern matching - could be enhanced with regex support
    return filePath.includes(pattern);
  });
}

/**
 * Filters file paths by extension
 */
export function filterByExtension(filePaths: string[], extensions: string[]): string[] {
  if (!extensions || extensions.length === 0) {
    return filePaths;
  }

  return filePaths.filter(path => {
    const lowerPath = path.toLowerCase();
    return extensions.some(ext => lowerPath.endsWith(ext.toLowerCase()));
  });
}

/**
 * Recursively traverses directories to find files matching the search criteria
 */
export async function recursiveFileSearch(
  searchPath: string,
  searchTerm: string,
  options: {
    caseSensitive?: boolean;
    maxResults?: number;
    fileExtensions?: string[];
    excludePatterns?: string[];
  } = {}
): Promise<string[]> {
  const {
    caseSensitive = false,
    maxResults = 50,
    fileExtensions,
    excludePatterns = []
  } = options;

  // On Unix-like systems, use find command
  let findCommand = `find "${searchPath}" -type f`;

  // Add extension filtering if specified
  if (fileExtensions && fileExtensions.length > 0) {
    if (fileExtensions.length === 1) {
      findCommand += ` -name "*.${fileExtensions[0].replace('.', '')}"`;
    } else {
      findCommand += ` \\( -name "*.${fileExtensions[0].replace('.', '')}"`;
      for (let i = 1; i < fileExtensions.length; i++) {
        findCommand += ` -o -name "*.${fileExtensions[i].replace('.', '')}"`;
      }
      findCommand += ` \\)`;
    }
  }

  // Execute the find command
  try {
    // This will be handled by the tool that has access to terminal execution
    const commandToExecute = `${findCommand} 2>/dev/null | grep -i "${searchTerm}"`;
    return executeFileSearch(commandToExecute, searchTerm, maxResults, excludePatterns, fileExtensions);
  } catch (error) {
    console.error('Error in recursiveFileSearch:', error);
    return [];
  }
}