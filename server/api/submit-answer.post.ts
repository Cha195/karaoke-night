import { GameBoardDTO, SubmitAnswerParamsSchema } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { gameBoardToGameBoardDTO, submitAnswer } from "../service/game";

export default defineEventHandler<
  Promise<ServerResponseType<{ board: GameBoardDTO; isCorrect: boolean }>>
>(async (event) => {
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
      SubmitAnswerParamsSchema.safeParse(body)
    );

    if (!success) {
      throw {
        success: false,
        status: 400,
        message: "Error parsing body",
        error: error.issues,
      };
    }

    const { board, isCorrect } = await submitAnswer({
      answer: data.answer,
      gameId: data.gameId,
      tileId: data.tileId,
      playerId,
    });

    const gameBoardDTO = gameBoardToGameBoardDTO(board, playerId);

    return {
      status: 200,
      success: true,
      message: "Successfully generated Game board",
      data: { board: gameBoardDTO, isCorrect },
    };
  } catch (err) {
    return {
      success: false,
      status: 500,
      message: `Error while generating board.`,
      error: err,
    };
  }
});
