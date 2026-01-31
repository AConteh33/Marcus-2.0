import type { FunctionDeclaration } from "@google/genai";

export interface Tool {
    /**
     * Gets the function declaration that will be sent to the AI model.
     * This defines the tool's name, description, and parameters.
     */
    getDeclaration(): FunctionDeclaration;

    /**
     * Executes the tool's logic with the arguments provided by the AI.
     * @param args - The arguments for the function call, parsed from the AI's response.
     * @returns A promise that resolves to a string result to be sent back to the AI.
     */
    execute(args: any): Promise<string>;
}
