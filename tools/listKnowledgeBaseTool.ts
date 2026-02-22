import { FunctionDeclaration, Type } from "@google/genai";
import type { Tool } from "../tool";

export class ListKnowledgeBaseTool implements Tool {

    getDeclaration(): FunctionDeclaration {
        return {
            name: "listKnowledgeBase",
            description: "List all documents currently stored in your knowledge base. Shows document titles, types, chunk counts, and last updated timestamps.",
            parameters: {
                type: Type.OBJECT,
                properties: {},
                required: []
            }
        };
    }

    async execute(args: {}): Promise<string> {
        try {
            console.log("📋 LIST KB: Starting knowledge base listing");

            // Use Electron IPC to call main process RAG service
            if (typeof window !== 'undefined' && window.electronAPI) {
                console.log("📋 LIST KB: Using Electron RAG API");
                const documents = await window.electronAPI.ragListDocuments();

                if (documents.length === 0) {
                    return "Your knowledge base is empty. Use the ingestDocument tool to add some documents first.";
                }

                console.log("📋 LIST KB: Found", documents.length, "documents");

                let response = `Your knowledge base contains ${documents.length} document${documents.length !== 1 ? 's' : ''}:\n\n`;

                for (let i = 0; i < documents.length; i++) {
                    const doc = documents[i];

                    response += `**${i + 1}. ${doc.title}**\n`;
                    if (doc.type) response += `   Type: ${doc.type}\n`;
                    if (doc.source) response += `   Source: ${doc.source}\n`;
                    response += `   Chunks: ${doc.chunks}\n`;
                    if (doc.last_updated) {
                        response += `   Last Updated: ${new Date(doc.last_updated).toLocaleDateString()}\n`;
                    }
                    response += `\n`;
                }

                response += "You can search these documents using the searchKnowledgeBase tool or remove them with removeDocument.";

                console.log("📋 LIST KB: Formatted response length:", response.length);
                return response;
            }

            console.log("📋 LIST KB: No Electron API available");
            return "Knowledge base listing requires Electron environment. This tool only works in the Marcus desktop application.";

        } catch (error) {
            const errorMessage = `Failed to list knowledge base: ${error instanceof Error ? error.message : String(error)}`;
            console.error("📋 LIST KB ERROR:", errorMessage);
            return errorMessage;
        }
    }
}
