import { GetGameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { gameBoardToGameBoardDTO, getGameByGameId } from "../service/game";

export default defineEventHandler(async (event) => {
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
});
