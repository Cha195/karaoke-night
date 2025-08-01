import { StartGameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import {
  addGamePlayerMap,
  gameBoardToGameBoardDTO,
  generateBoard,
} from "../service/game";

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

      const { success, data, error } = await readValidatedBody(event, (body) =>
        StartGameParamsSchema.safeParse(body)
      );

      if (!success) {
        throw {
          success: false,
          status: 400,
          message: "Error parsing body",
          error: error.issues,
        };
      }

      const board = await generateBoard(data, playerId, playerName);

      const gameBoardDTO = await gameBoardToGameBoardDTO(board, playerId);

      return {
        status: 200,
        success: true,
        message: "Successfully generated Game board",
        data: gameBoardDTO,
      };
    } catch (err) {
      return {
        success: false,
        status: 500,
        message: `Error while generating board.`,
        error: err,
      };
    }
  }
);
