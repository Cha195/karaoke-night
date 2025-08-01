import { GetGameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { startGameByGameId, gameBoardToGameBoardDTO } from "../service/game";
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
          message: "Player ID does not exist",
        };
      }

      const query = getQuery(event);

      const parseResult = GetGameParamsSchema.safeParse(query);
      if (!parseResult.success) {
        throw {
          success: false,
          status: 400,
          message: "Error parsing query params",
          error: parseResult.error.issues,
        };
      }

      const { gameId } = parseResult.data;
      const startedBoard = await startGameByGameId(gameId, playerId);

      if (!startedBoard) {
        throw new Error("Failed to get board state after starting game.");
      }

      const gameBoardDTO = await gameBoardToGameBoardDTO(
        startedBoard,
        playerId
      );

      // Broadcast the initial state to all players
      broadcastToGame(gameId, {
        type: WebSocketMessageType.GameStateUpdate,
        payload: gameBoardDTO,
      });

      return {
        status: 200,
        success: true,
        message: "Successfully started the game",
        data: gameBoardDTO,
      };
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      return {
        status: 400,
        success: false,
        message: `Error starting game: ${errorMessage}`,
        error: err,
      };
    }
  }
);
