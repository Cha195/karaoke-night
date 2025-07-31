import { GoogleGenAI } from "@google/genai";
import { getGameCreationPrompt } from "~/constants/ai";
import { StartGameParamsSchema } from "~/model/game";
import type { StartGameParams } from "~/model/game";

// AI Model interface for easy swapping
export interface AIModel {
  name: string;
  processGamePrompt(prompt: string): Promise<StartGameParams>;
}

// Singleton instance for Gemini AI (one per request)
let geminiInstance: GeminiAIModel | null = null;

// Google Gemini AI implementation
export class GeminiAIModel implements AIModel {
  private ai: GoogleGenAI;

  private constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY environment variable is required");
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  // Singleton pattern - one instance per request
  static getInstance(): GeminiAIModel {
    if (!geminiInstance) {
      geminiInstance = new GeminiAIModel();
    }
    return geminiInstance;
  }

  // Reset instance (useful for testing)
  static resetInstance(): void {
    geminiInstance = null;
  }

  get name(): string {
    return "gemini-2.5-flash";
  }

  async processGamePrompt(prompt: string): Promise<StartGameParams> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: getGameCreationPrompt(prompt),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              artists: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              genres: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              decades: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              moods: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              limit: { type: "NUMBER" },
            },
            propertyOrdering: [
              "artists",
              "genres",
              "decades",
              "moods",
              "limit",
            ],
          },
        },
      });

      if (!response.text) {
        throw new Error("No response text from AI model");
      }

      const gameParams = JSON.parse(response.text);

      // Validate and return using Zod schema
      return this.validateGameParams(gameParams);
    } catch (error) {
      console.error("Gemini AI error:", error);
      throw error;
    }
  }

  private validateGameParams(params: any): StartGameParams {
    // Use Zod schema for validation
    const validated = StartGameParamsSchema.parse(params);

    // Ensure all string arrays are lowercase
    if (validated.artists) {
      validated.artists = validated.artists.map((artist) =>
        artist.toLowerCase()
      );
    }
    if (validated.genres) {
      validated.genres = validated.genres.map((genre) => genre.toLowerCase());
    }
    if (validated.decades) {
      validated.decades = validated.decades.map((decade) =>
        decade.toLowerCase()
      );
    }
    if (validated.moods) {
      validated.moods = validated.moods.map((mood) => mood.toLowerCase());
    }

    // Cap limit at 50
    if (validated.limit > 50) {
      validated.limit = 50;
    }

    return validated;
  }
}

// AI Agent Service - manages different models
export class AIAgentService {
  private models: Map<string, AIModel> = new Map();

  constructor() {
    // Register available models
    this.registerModel("gemini", GeminiAIModel.getInstance());
  }

  registerModel(name: string, model: AIModel): void {
    this.models.set(name, model);
  }

  getModel(name: string = "gemini"): AIModel {
    const model = this.models.get(name);

    if (!model) {
      throw new Error(`AI model '${name}' not found`);
    }

    return model;
  }

  async processGamePrompt(
    prompt: string,
    modelName: string = "gemini"
  ): Promise<StartGameParams> {
    const model = this.getModel(modelName);
    console.log(`Using AI model: ${model.name}`);

    try {
      return await model.processGamePrompt(prompt);
    } catch (error) {
      console.error(`Error with AI model ${model.name}:`, error);
      throw error;
    }
  }

  getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }
}

// Export singleton instance
export const aiAgentService = new AIAgentService();
