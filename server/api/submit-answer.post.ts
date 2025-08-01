import { GameBoardDTO, SubmitAnswerParamsSchema } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { gameBoardToGameBoardDTO, submitAnswer } from "../service/game";
import { WebSocketMessageType } from "~/model/ws"; // Import the broadcast function
import { broadcastToGame } from "../routes/_ws";

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

    const gameBoardDTO = await gameBoardToGameBoardDTO(board, playerId);

    // Broadcast the updated game state to all clients in the room
    broadcastToGame(data.gameId, {
      type: WebSocketMessageType.GameStateUpdate,
      payload: gameBoardDTO,
    });

    return {
      status: 200,
      success: true,
      message: "Successfully submitted answer",
      data: { board: gameBoardDTO, isCorrect },
    };
  } catch (err) {
    // It's good practice to handle potential errors from your services
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred.";
    return {
      success: false,
      status: 500,
      message: `Error while submitting answer: ${errorMessage}`,
      error: err,
    };
  }
});
