import { GetGameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { startGameByGameId } from "../service/game";

export default defineEventHandler<Promise<ServerResponseType<boolean>>>(
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
      const result = await startGameByGameId(gameId);

      return {
        status: result ? 200 : 400,
        success: result,
        data: result,
        message: "Player ID does not exist",
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
