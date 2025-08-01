import { GameBoardDTO, GetGameParamsSchema } from "~/model/game";
import { ServerResponseType } from "../models/api";
import {
  addGamePlayerMap,
  getGameByGameId,
  gameBoardToGameBoardDTO,
} from "../service/game";
import { WebSocketMessageType } from "~/model/ws";
import { broadcastToGame } from "../routes/_ws";

export default defineEventHandler<Promise<ServerResponseType<GameBoardDTO>>>(
  async (event) => {
    try {
      const playerId = getHeader(event, "player-id");
      const playerName = getHeader(event, "player-name");

      if (!playerId || !playerName) {
        return {
          status: 400,
          success: false,
          message: "Player ID is required.",
        };
      }

      const { success, data, error } = await readValidatedBody(event, (body) =>
        GetGameParamsSchema.safeParse(body)
      );

      if (!success) {
        throw {
          status: 400,
          message: "Invalid request body.",
          error: error.issues,
        };
      }

      const { gameId } = data;

      const board = await getGameByGameId(gameId);
      if (!board) {
        return {
          status: 404,
          success: false,
          message: "Game not found. Please check the ID.",
        };
      }

      await addGamePlayerMap({ gameId, playerId, playerName });

      const gameBoardDTO = await gameBoardToGameBoardDTO(board, playerId);

      broadcastToGame(gameId, {
        type: WebSocketMessageType.GameStateUpdate,
        payload: gameBoardDTO,
      });

      return {
        status: 200,
        success: true,
        message: "Successfully joined the game.",
        data: gameBoardDTO,
      };
    } catch (err: any) {
      const errorMessage =
        err.data?.message || err.message || "An unknown error occurred.";
      return {
        success: false,
        status: err.status || 500,
        message: `Error joining game: ${errorMessage}`,
        error: err,
      };
    }
  }
);
