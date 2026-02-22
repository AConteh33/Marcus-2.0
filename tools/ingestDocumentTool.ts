import { FunctionDeclaration, Type } from "@google/genai";
import type { Tool } from "../tool";

export class IngestDocumentTool implements Tool {

    getDeclaration(): FunctionDeclaration {
        return {
            name: "ingestDocument",
            description: "Add a document to the knowledge base for future retrieval and research. Supports text content, PDFs, and other document types. The document will be chunked and embedded for semantic search.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    content: {
                        type: Type.STRING,
                        description: "The full text content of the document to ingest"
                    },
                    title: {
                        type: Type.STRING,
                        description: "Title or name of the document (optional, will use filename or 'Untitled' if not provided)"
                    },
                    source: {
                        type: Type.STRING,
                        description: "Source or file path of the document (optional)"
                    },
                    type: {
                        type: Type.STRING,
                        description: "Document type: 'text', 'pdf', 'markdown', 'code', 'research', 'notes', etc. (optional)"
                    }
                },
                required: ["content"]
            }
        };
    }

    async execute(args: { content: string; title?: string; source?: string; type?: string }): Promise<string> {
        try {
            console.log("📄 INGEST DOC: Starting document ingestion");
            console.log("📄 INGEST DOC: Title:", args.title);
            console.log("📄 INGEST DOC: Content length:", args.content?.length || 0);

            // Use Electron IPC to call main process RAG service
            if (typeof window !== 'undefined' && window.electronAPI) {
                console.log("📄 INGEST DOC: Using Electron RAG API");
                const result = await window.electronAPI.ragIngestDocument({
                    content: args.content,
                    metadata: {
                        title: args.title || "Untitled Document",
                        source: args.source,
                        type: args.type || "text"
                    }
                });
                console.log("📄 INGEST DOC: Success:", result);
                return result;
            }

            console.log("📄 INGEST DOC: No Electron API available");
            return "Document ingestion requires Electron environment. This tool only works in the Marcus desktop application.";

        } catch (error) {
            const errorMessage = `Failed to ingest document: ${error instanceof Error ? error.message : String(error)}`;
            console.error("📄 INGEST DOC ERROR:", errorMessage);
            return errorMessage;
        }
    }
}
