import type { Tool } from "./tool";
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

export class DuckDuckGoSearchTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'searchWeb',
      description: 'Search the web using DuckDuckGo for information, news, answers, and research. Provides privacy-focused search results with AI-assisted answers when available.',
      parameters: {
        type: Type.OBJECT,
        description: 'Parameters for web search',
        properties: {
          query: {
            type: Type.STRING,
            description: 'The search query to look up on the web'
          },
          safeSearch: {
            type: Type.STRING,
            description: 'Safe search level: "strict", "moderate", or "off" (default: "moderate")',
            enum: ["strict", "moderate", "off"]
          },
          timeRange: {
            type: Type.STRING,
            description: 'Time filter for results: "d" (day), "w" (week), "m" (month), "y" (year)',
            enum: ["d", "w", "m", "y"]
          },
          region: {
            type: Type.STRING,
            description: 'Region for search results (e.g., "us-en", "uk-en", "ca-en")'
          },
          maxResults: {
            type: Type.NUMBER,
            description: 'Maximum number of results to return (default: 10)'
          }
        },
        required: ['query']
      }
    };
  }

  async execute(args: any): Promise<string> {
    try {
      const {
        query,
        safeSearch = "moderate",
        timeRange,
        region = "us-en",
        maxResults = 10
      } = args;

      if (!query || typeof query !== 'string') {
        return 'Error: Search query is required and must be a string.';
      }

      // Build DuckDuckGo search URL with parameters
      const searchParams = new URLSearchParams({
        q: query,
        kl: region,
        safe: safeSearch,
        t: "h_",
        ia: "web"
      });

      // Add time range if specified
      if (timeRange) {
        searchParams.set('df', timeRange);
      }

      // Add result count limit
      searchParams.set('num', Math.min(maxResults, 50).toString());

      const searchUrl = `https://html.duckduckgo.com/html/?${searchParams.toString()}`;

      // Use fetch to get search results
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse search results from HTML
      const results = this.parseSearchResults(html, maxResults);
      
      if (results.length === 0) {
        return `No results found for query: "${query}"`;
      }

      // Format results for AI
      let formattedResults = `Search results for "${query}":\n\n`;
      
      results.forEach((result, index) => {
        formattedResults += `${index + 1}. ${result.title}\n`;
        formattedResults += `   URL: ${result.url}\n`;
        formattedResults += `   Snippet: ${result.snippet}\n\n`;
      });

      formattedResults += `\nFound ${results.length} results. Use this information to answer the user's question or provide relevant details.`;
      
      return formattedResults;

    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          return 'Error: Unable to connect to DuckDuckGo search. Please check your internet connection.';
        }
        return `Error: ${error.message}`;
      }
      
      return 'Error: An unexpected error occurred during web search.';
    }
  }

  private parseSearchResults(html: string, maxResults: number): Array<{
    title: string;
    url: string;
    snippet: string;
  }> {
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    
    try {
      // Simple HTML parsing to extract search results
      // DuckDuckGo HTML results have specific structure
      const resultRegex = /<div[^>]*class="result"[^>]*>[\s\S]*?<\/div>/g;
      const matches = html.match(resultRegex) || [];
      
      for (let i = 0; i < Math.min(matches.length, maxResults); i++) {
        const match = matches[i];
        
        // Extract title
        const titleMatch = match.match(/<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/);
        const title = titleMatch ? this.cleanText(titleMatch[1]) : 'No title';
        
        // Extract URL
        const urlMatch = match.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"/);
        const url = urlMatch ? this.decodeDuckDuckGoURL(urlMatch[1]) : 'No URL';
        
        // Extract snippet
        const snippetMatch = match.match(/<a[^>]*class="result__snippet"[^>]*>([^<]+)<\/a>/);
        const snippet = snippetMatch ? this.cleanText(snippetMatch[1]) : 'No description available';
        
        if (url !== 'No URL' && title !== 'No title') {
          results.push({ title, url, snippet });
        }
      }
    } catch (error) {
      console.error('Error parsing search results:', error);
    }
    
    return results;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private decodeDuckDuckGoURL(url: string): string {
    try {
      // DuckDuckGo uses redirect URLs that need to be decoded
      if (url.startsWith('/l/?uddg=')) {
        const encoded = url.substring('/l/?uddg='.length);
        return decodeURIComponent(encoded);
      }
      
      // Handle other redirect formats
      if (url.includes('uddg=')) {
        const match = url.match(/uddg=([^&]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
      
      // Return as-is if it's already a direct URL
      return url.startsWith('http') ? url : `https:${url}`;
    } catch (error) {
      console.error('Error decoding URL:', error);
      return url;
    }
  }
}
