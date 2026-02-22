import { GoogleGenAI } from "@google/genai";
import { ChromaClient } from "chromadb";

export class RAGService {
    private ai: GoogleGenAI;
    private chroma: ChromaClient;
    private collectionName = "knowledge_base";

    constructor() {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not set");
        }
        this.ai = new GoogleGenAI({ apiKey });
        this.chroma = new ChromaClient();
    }

    /**
     * Generate embeddings for text using Google's text-embedding-004
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            const result = await this.ai.embedContent({
                content: { parts: [{ text }] },
                model: "text-embedding-004"
            });
            return result.embedding.values;
        } catch (error) {
            console.error("Embedding generation failed:", error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Split text into chunks for better retrieval
     */
    private splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            let end = start + chunkSize;
            if (end > text.length) {
                end = text.length;
            }

            // Try to end at a sentence boundary
            if (end < text.length) {
                const lastPeriod = text.lastIndexOf('.', end);
                const lastNewline = text.lastIndexOf('\n', end);
                const lastSpace = text.lastIndexOf(' ', end);

                const bestBreak = Math.max(lastPeriod, lastNewline, lastSpace);
                if (bestBreak > start + chunkSize / 2) {
                    end = bestBreak + 1;
                }
            }

            chunks.push(text.slice(start, end).trim());
            start = end - overlap;

            if (start >= text.length) break;
        }

        return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
    }

    /**
     * Ingest a document into the knowledge base
     */
    async ingestDocument(content: string, metadata: { title?: string; source?: string; type?: string }): Promise<string> {
        try {
            console.log("🧠 RAG: Starting document ingestion");
            console.log("🧠 RAG: Content length:", content.length);

            // Get or create collection
            let collection;
            try {
                collection = await this.chroma.getCollection({ name: this.collectionName });
            } catch (error) {
                console.log("🧠 RAG: Creating new collection");
                collection = await this.chroma.createCollection({ name: this.collectionName });
            }

            // Split into chunks
            const chunks = this.splitIntoChunks(content);
            console.log("🧠 RAG: Split into", chunks.length, "chunks");

            // Generate embeddings and add to collection
            const ids: string[] = [];
            const embeddings: number[][] = [];
            const documents: string[] = [];
            const metadatas: any[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const embedding = await this.generateEmbedding(chunk);

                const chunkId = `${metadata.title || 'doc'}_${Date.now()}_${i}`;
                const chunkMetadata = {
                    ...metadata,
                    chunk_index: i,
                    total_chunks: chunks.length,
                    timestamp: new Date().toISOString()
                };

                ids.push(chunkId);
                embeddings.push(embedding);
                documents.push(chunk);
                metadatas.push(chunkMetadata);

                console.log(`🧠 RAG: Processed chunk ${i + 1}/${chunks.length}`);
            }

            // Add to collection in batches to avoid memory issues
            const batchSize = 10;
            for (let i = 0; i < ids.length; i += batchSize) {
                const batchEnd = Math.min(i + batchSize, ids.length);
                await collection.add({
                    ids: ids.slice(i, batchEnd),
                    embeddings: embeddings.slice(i, batchEnd),
                    documents: documents.slice(i, batchEnd),
                    metadatas: metadatas.slice(i, batchEnd)
                });
                console.log(`🧠 RAG: Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ids.length / batchSize)}`);
            }

            const result = `Successfully ingested document "${metadata.title || 'Untitled'}" with ${chunks.length} chunks`;
            console.log("🧠 RAG: Ingestion complete:", result);
            return result;

        } catch (error) {
            console.error("🧠 RAG: Ingestion failed:", error);
            throw new Error(`Failed to ingest document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Search the knowledge base for relevant documents
     */
    async searchKnowledgeBase(query: string, limit: number = 5): Promise<any[]> {
        try {
            console.log("🧠 RAG: Starting knowledge base search");
            console.log("🧠 RAG: Query:", query);

            // Get collection
            let collection;
            try {
                collection = await this.chroma.getCollection({ name: this.collectionName });
            } catch (error) {
                console.log("🧠 RAG: No knowledge base collection found");
                return [];
            }

            // Generate query embedding
            const queryEmbedding = await this.generateEmbedding(query);

            // Search
            const results = await collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: limit
            });

            console.log("🧠 RAG: Found", results.documents?.[0]?.length || 0, "relevant chunks");

            // Format results
            const formattedResults: any[] = [];
            if (results.documents && results.documents[0]) {
                for (let i = 0; i < results.documents[0].length; i++) {
                    formattedResults.push({
                        content: results.documents[0][i],
                        metadata: results.metadatas?.[0]?.[i] || {},
                        distance: results.distances?.[0]?.[i] || 0,
                        id: results.ids?.[0]?.[i] || ''
                    });
                }
            }

            return formattedResults;

        } catch (error) {
            console.error("🧠 RAG: Search failed:", error);
            throw new Error(`Failed to search knowledge base: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List all documents in the knowledge base
     */
    async listDocuments(): Promise<any[]> {
        try {
            console.log("🧠 RAG: Listing documents");

            let collection;
            try {
                collection = await this.chroma.getCollection({ name: this.collectionName });
            } catch (error) {
                console.log("🧠 RAG: No knowledge base collection found");
                return [];
            }

            // Get all documents (with limit to avoid memory issues)
            const results = await collection.get({
                limit: 1000
            });

            // Group by document title/source
            const documents: { [key: string]: any } = {};

            if (results.metadatas) {
                for (let i = 0; i < results.metadatas.length; i++) {
                    const metadata = results.metadatas[i];
                    const key = metadata.title || metadata.source || 'Untitled';

                    if (!documents[key]) {
                        documents[key] = {
                            title: key,
                            type: metadata.type || 'unknown',
                            source: metadata.source || '',
                            chunks: 0,
                            last_updated: metadata.timestamp
                        };
                    }
                    documents[key].chunks++;
                    if (metadata.timestamp > documents[key].last_updated) {
                        documents[key].last_updated = metadata.timestamp;
                    }
                }
            }

            const documentList = Object.values(documents);
            console.log("🧠 RAG: Found", documentList.length, "documents");
            return documentList;

        } catch (error) {
            console.error("🧠 RAG: List documents failed:", error);
            throw new Error(`Failed to list documents: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Remove a document from the knowledge base
     */
    async removeDocument(title: string): Promise<string> {
        try {
            console.log("🧠 RAG: Removing document:", title);

            let collection;
            try {
                collection = await this.chroma.getCollection({ name: this.collectionName });
            } catch (error) {
                throw new Error("Knowledge base collection not found");
            }

            // Find all chunks for this document
            const results = await collection.get({
                where: { title: title }
            });

            if (!results.ids || results.ids.length === 0) {
                throw new Error(`Document "${title}" not found in knowledge base`);
            }

            // Remove all chunks
            await collection.delete({
                ids: results.ids
            });

            const result = `Successfully removed document "${title}" (${results.ids.length} chunks)`;
            console.log("🧠 RAG: Removal complete:", result);
            return result;

        } catch (error) {
            console.error("🧠 RAG: Removal failed:", error);
            throw new Error(`Failed to remove document: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
