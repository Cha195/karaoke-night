import {
  DifficultyEnum,
  GameBoard,
  GameBoardDTO,
  StartGameParams,
  SpotifyTrack,
  GameBoardSchema,
  GameStatusEnum,
} from "~/model/game";
import { fetchTracks, queryGenerator, fetchVideoLinks } from "./game-provider";
import { getRedis } from "./redis";

const DifficultyBucket: DifficultyEnum[] = [
  DifficultyEnum["Very Easy"],
  DifficultyEnum["Easy"],
  DifficultyEnum["Medium"],
  DifficultyEnum["Hard"],
  DifficultyEnum["Very Hard"],
];

export const generateBoard = async (
  params: StartGameParams
): Promise<GameBoard> => {
  const query = queryGenerator(params);
  const tracks = await fetchTracks(query, params.limit);

  if (!tracks.length) throw new Error("Could not fetch tracks");

  const videoLinks = await fetchVideoLinks(tracks);
  const sortedTracks = [...tracks].sort((a, b) => a.popularity - b.popularity);

  const board = {
    gameId: crypto.randomUUID(),
    state: GameStatusEnum.Unstarted,
    tiles: sortedTracks.map((track: SpotifyTrack, index) => ({
      tileId: track.id,
      previewUrl: videoLinks[track.id],
      artist: track.artists[0]?.name || "Unknown Artist",
      title: track.name,
      difficulty: DifficultyBucket[Math.floor(index / 5)],
      points: 5 * Math.ceil((index + 1) / 5),
    })),
  };

  const redis = getRedis();
  await redis.set(board.gameId, JSON.stringify(board), {
    ex: 60 * 60 * 24, // 1 day TTL
  });

  return board;
};

export const gameBoardToGameBoardDTO = (
  board: GameBoard,
  playerId: string
): GameBoardDTO => {
  return {
    playerId,
    gameId: board.gameId,
    state: board.state,
    tiles: board.tiles.map((tile) => ({
      tileId: tile.tileId,
      difficulty: tile.difficulty,
      points: tile.points,
      previewUrl: tile.previewUrl,
    })),
  };
};

export const getGameByGameId = async (
  gameId: string
): Promise<GameBoard | null> => {
  const redis = getRedis();
  const stringifiedBoard = await redis.get(gameId);
  if (!stringifiedBoard) return null;

  const gameBoard: GameBoard = GameBoardSchema.parse(stringifiedBoard);
  return gameBoard;
};

export const startGameByGameId = async (gameId: string): Promise<boolean> => {
  const gameBoard = await getGameByGameId(gameId);
  if (!gameBoard) return false;

  gameBoard.state = GameStatusEnum.InProgress;
  const redis = getRedis();

  await redis.set(gameId, JSON.stringify(gameBoard), {
    ex: 60 * 60 * 24, // 1 day TTL
  });

  return true;
};

export const deleteGameByGameId = async (gameId: string): Promise<void> => {
  const redis = getRedis();
  redis.del(gameId);
};
