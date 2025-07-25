import { GameParamsSchema, GameBoardDTO } from "~/model/game";
import { ServerResponseType } from "../models/api";
import { generateBoard } from "../service/game";

export default defineEventHandler<Promise<ServerResponseType<GameBoardDTO>>>(
  async (event) => {
    try {
      const { success, data, error } = await readValidatedBody(event, (body) =>
        GameParamsSchema.safeParse(body)
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

      console.log("board", board);

      // Return a mock GameBoard object
      return {
        status: 200,
        success: true,
        message: "Successfully generated Game board",
        data: { playerId: crypto.randomUUID(), ...board },
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
