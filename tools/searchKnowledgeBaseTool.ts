import { FunctionDeclaration, Type } from "@google/genai";
import type { Tool } from "../tool";

export class SearchKnowledgeBaseTool implements Tool {

    getDeclaration(): FunctionDeclaration {
        return {
            name: "searchKnowledgeBase",
            description: "Search through your personal knowledge base for relevant information. Returns the most similar document chunks based on semantic similarity to your query. Use this to retrieve information from previously ingested documents.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    query: {
                        type: Type.STRING,
                        description: "The search query to find relevant information in your knowledge base"
                    },
                    limit: {
                        type: Type.NUMBER,
                        description: "Maximum number of results to return (default: 5, max: 10)"
                    }
                },
                required: ["query"]
            }
        };
    }

    async execute(args: { query: string; limit?: number }): Promise<string> {
        try {
            console.log("🔍 SEARCH KB: Starting knowledge base search");
            console.log("🔍 SEARCH KB: Query:", args.query);
            console.log("🔍 SEARCH KB: Limit:", args.limit || 5);

            // Use Electron IPC to call main process RAG service
            if (typeof window !== 'undefined' && window.electronAPI) {
                console.log("🔍 SEARCH KB: Using Electron RAG API");
                const results = await window.electronAPI.ragSearchKnowledgeBase({
                    query: args.query,
                    limit: Math.min(args.limit || 5, 10)
                });

                if (results.length === 0) {
                    return "No relevant information found in your knowledge base. Try ingesting some documents first using the ingestDocument tool.";
                }

                console.log("🔍 SEARCH KB: Found", results.length, "results");

                // Format results for the AI
                let response = `Found ${results.length} relevant chunks from your knowledge base:\n\n`;

                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    const metadata = result.metadata;

                    response += `**Result ${i + 1}:**\n`;
                    response += `**Document:** ${metadata.title || 'Untitled'}\n`;
                    if (metadata.type) response += `**Type:** ${metadata.type}\n`;
                    if (metadata.source) response += `**Source:** ${metadata.source}\n`;
                    response += `**Relevance Score:** ${(1 - result.distance).toFixed(3)}\n`;
                    response += `**Content:**\n${result.content}\n\n`;
                    response += `---\n\n`;
                }

                response += "Use this information to provide informed responses based on your knowledge base.";

                console.log("🔍 SEARCH KB: Formatted response length:", response.length);
                return response;
            }

            console.log("🔍 SEARCH KB: No Electron API available");
            return "Knowledge base search requires Electron environment. This tool only works in the Marcus desktop application.";

        } catch (error) {
            const errorMessage = `Failed to search knowledge base: ${error instanceof Error ? error.message : String(error)}`;
            console.error("🔍 SEARCH KB ERROR:", errorMessage);
            return errorMessage;
        }
    }
}
