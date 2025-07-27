import {
  GetGameParamsSchema,
  GameBoardDTO,
  GameStatusEnum,
} from "~/model/game";
import { ServerResponseType } from "../models/api";
import {
  addGamePlayerMap,
  gameBoardToGameBoardDTO,
  getGameByGameId,
} from "../service/game";

export default defineEventHandler<
  Promise<ServerResponseType<GameBoardDTO | null>>
>(async (event) => {
  try {
    const playerId = getHeader(event, "player-id");

    if (!playerId) {
      return {
        status: 400,
        success: false,
        message: "Player ID does not exist",
        data: null,
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

    const board = await getGameByGameId(gameId);
    if (!board) {
      return {
        status: 400,
        success: false,
        message: "Game does not exist",
        data: null,
      };
    }

    if (board.state !== GameStatusEnum.Unstarted) {
      return {
        status: 400,
        success: false,
        message: "Game has already started",
        data: null,
      };
    }

    await addGamePlayerMap({ gameId: board.gameId, playerId });
    const gameBoardDTO = gameBoardToGameBoardDTO(board, crypto.randomUUID());

    return {
      status: 200,
      success: true,
      message: "Successfully generated Game board",
      data: gameBoardDTO,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      status: 500,
      message: "Error while getting board.",
      error: err,
    };
  }
});
