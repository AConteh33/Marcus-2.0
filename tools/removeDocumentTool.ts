import { FunctionDeclaration, Type } from "@google/genai";
import type { Tool } from "../tool";

export class RemoveDocumentTool implements Tool {

    getDeclaration(): FunctionDeclaration {
        return {
            name: "removeDocument",
            description: "Remove a document from your knowledge base. This will delete all chunks associated with the specified document title.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "The title of the document to remove from the knowledge base"
                    }
                },
                required: ["title"]
            }
        };
    }

    async execute(args: { title: string }): Promise<string> {
        try {
            console.log("🗑️ REMOVE DOC: Starting document removal");
            console.log("🗑️ REMOVE DOC: Title:", args.title);

            // Use Electron IPC to call main process RAG service
            if (typeof window !== 'undefined' && window.electronAPI) {
                console.log("🗑️ REMOVE DOC: Using Electron RAG API");
                const result = await window.electronAPI.ragRemoveDocument({
                    title: args.title
                });
                console.log("🗑️ REMOVE DOC: Success:", result);
                return result;
            }

            console.log("🗑️ REMOVE DOC: No Electron API available");
            return "Document removal requires Electron environment. This tool only works in the Marcus desktop application.";

        } catch (error) {
            const errorMessage = `Failed to remove document: ${error instanceof Error ? error.message : String(error)}`;
            console.error("🗑️ REMOVE DOC ERROR:", errorMessage);
            return errorMessage;
        }
    }
}
