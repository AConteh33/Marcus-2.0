import { getFoodOrderSystemPrompt } from '../prompts/foodOrderPrompt';

class FoodOrderPromptService {
  getSystemInstruction(): string {
    return getFoodOrderSystemPrompt();
  }
}

export const promptService = new FoodOrderPromptService();
