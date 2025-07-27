import { GetGameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { deleteGameByGameId } from "../service/game";

export default defineEventHandler<Promise<ServerResponseType<void>>>(
  async (event) => {
    try {
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

      await deleteGameByGameId(gameId);

      return {
        status: 200,
        success: true,
        message: "Successfully ended game",
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        status: 500,
        message: "Error while deleting board.",
        error: err,
      };
    }
  }
);
