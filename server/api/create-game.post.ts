import { StartGameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { gameBoardToGameBoardDTO, generateBoard } from "../service/game";
import { getRedis } from "../service/redis";

export default defineEventHandler<Promise<ServerResponseType<GameBoardDTO>>>(
  async (event) => {
    try {
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

      const board = await generateBoard(data);
      const gameBoardDTO = gameBoardToGameBoardDTO(board, crypto.randomUUID());

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
