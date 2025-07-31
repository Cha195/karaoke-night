import { type StartGameParams, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { z } from "zod";
import {
  addGamePlayerMap,
  gameBoardToGameBoardDTO,
  generateBoard,
} from "../service/game";

export default defineEventHandler<Promise<ServerResponseType<GameBoardDTO>>>(
  async (event) => {
    try {
      const playerId = getHeader(event, "player-id");

      if (!playerId) {
        return {
          status: 400,
          success: false,
          message: "Player ID does not exist",
        };
      }

      const { success, data, error } = await readValidatedBody(event, (body) =>
        z
          .object({
            prompt: z.string().min(1),
          })
          .safeParse(body)
      );

      if (!success) {
        throw {
          success: false,
          status: 400,
          message: "Error parsing body",
          error: error.issues,
        };
      }

      const { prompt } = data;

      // Use AI agent service to process the prompt
      const aiAgentService = await import("../service/ai-agent");
      const gameParams = await aiAgentService.aiAgentService.processGamePrompt(
        prompt
      );

      // Create the game board directly
      const board = await generateBoard(gameParams);
      await addGamePlayerMap({ gameId: board.gameId, playerId });

      // Convert to DTO and return
      const gameBoardDTO = await gameBoardToGameBoardDTO(board, playerId);

      return {
        status: 200,
        success: true,
        message: "Successfully created game from prompt",
        data: gameBoardDTO,
      };
    } catch (err) {
      return {
        success: false,
        status: 500,
        message: `Error while processing game prompt.`,
        error: err,
      };
    }
  }
);
