import { GetGameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { startGameByGameId } from "../service/game";

export default defineEventHandler<Promise<ServerResponseType<void>>>(
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
      await startGameByGameId(gameId);

      return {
        status: 200,
        success: true,
        message: "Successfully started the game",
      };
    } catch (err) {
      console.error(err);
      return {
        status: 400,
        success: false,
        message: "Error starting game",
        error: err,
      };
    }
  }
);
