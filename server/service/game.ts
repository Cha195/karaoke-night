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
import fuzzysort from "fuzzysort";

const DifficultyBucket: DifficultyEnum[] = [
  DifficultyEnum["Very Easy"],
  DifficultyEnum["Easy"],
  DifficultyEnum["Medium"],
  DifficultyEnum["Hard"],
  DifficultyEnum["Very Hard"],
];

const getGamePlayerMapKey = (gameId: string) => `game:${gameId}:players`;

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
      answeredBy: null,
    })),
  };

  const redis = getRedis();
  await redis.set(board.gameId, JSON.stringify(board), {
    ex: 60 * 60 * 24, // 1 day TTL
  });

  return board;
};

export const gameBoardToGameBoardDTO = async (
  board: GameBoard,
  playerId: string
): Promise<GameBoardDTO> => {
  const redis = getRedis();
  const gamePlayersKey = getGamePlayerMapKey(board.gameId);
  const playerScores = await redis.hgetall(gamePlayersKey);

  // Convert string values to numbers
  const scores: Record<string, number> = {};
  if (playerScores) {
    for (const [key, value] of Object.entries(playerScores)) {
      scores[key] = parseInt(value as string, 10);
    }
  }

  return {
    playerId,
    gameId: board.gameId,
    state: board.state,
    tiles: board.tiles.map((tile) => ({
      tileId: tile.tileId,
      difficulty: tile.difficulty,
      points: tile.points,
      previewUrl: tile.previewUrl,
      answeredBy: tile.answeredBy,
    })),
    playerScores: scores,
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

export const startGameByGameId = async (gameId: string): Promise<void> => {
  const gameBoard = await getGameByGameId(gameId);
  if (!gameBoard) throw new Error("Game does not exist");
  if (gameBoard.state !== GameStatusEnum.Unstarted)
    throw new Error("Game state invalid");

  gameBoard.state = GameStatusEnum.InProgress;
  const redis = getRedis();

  await redis.set(gameId, JSON.stringify(gameBoard), {
    ex: 60 * 60 * 24, // 1 day TTL
  });
};

export const deleteGameByGameId = async (gameId: string): Promise<void> => {
  const redis = getRedis();
  await redis.del(gameId);
  await redis.del(getGamePlayerMapKey(gameId));
};

export const addGamePlayerMap = async ({
  gameId,
  playerId,
}: {
  gameId: string;
  playerId: string;
}): Promise<boolean> => {
  const redis = getRedis();
  const board = await getGameByGameId(gameId);
  if (!board) throw new Error("Game does not exist");
  if (board.state !== GameStatusEnum.Unstarted)
    throw new Error("Game has already begun");

  const gamePlayersKey = getGamePlayerMapKey(gameId);

  const playerCount = await redis.hlen(gamePlayersKey);

  if (playerCount == 5) {
    throw new Error("Player limit reached. Cannot join the game.");
  }

  await redis.hset(gamePlayersKey, { [playerId]: 0 });
  if (playerCount === 0) {
    // Set the expiry when the first player joins
    await redis.expire(gamePlayersKey, 60 * 60 * 24);
  }

  return true;
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "") // remove () and [] content
    .replace(/\b(ft\.|feat\.|featuring)\b/g, "") // remove feat. words
    .replace(/[-–—]/g, " ") // replace dashes with space
    .replace(/[^a-z0-9\s]/gi, "") // remove non-alphanumeric
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
}

const matchAnswer = (userAnswer: string, correctTitle: string): boolean => {
  const cleanUser = normalizeTitle(userAnswer);
  const cleanCorrect = normalizeTitle(correctTitle);

  const result = fuzzysort.single(cleanUser, cleanCorrect);

  return result !== null && result.score !== undefined && result.score > -50;
};

export const submitAnswer = async ({
  gameId,
  playerId,
  tileId,
  answer,
}: {
  gameId: string;
  playerId: string;
  tileId: string;
  answer: string;
}): Promise<{ board: GameBoard; isCorrect: boolean }> => {
  const redis = getRedis();

  const board = await getGameByGameId(gameId);
  if (!board) throw new Error("Game does not exist");
  if (board.state !== GameStatusEnum.InProgress)
    throw new Error("Game not in progress");

  const tile = board.tiles.find((tile) => tile.tileId === tileId);
  if (!tile) throw new Error("Wrong tile id");
  if (tile.answeredBy !== null) throw new Error("Question already answered");

  const correctTitle = tile.title;
  const isCorrect = matchAnswer(answer, correctTitle);
  if (isCorrect) {
    await updatePlayerGameScore({ gameId, playerId, score: tile.points });
  }

  tile.answeredBy = playerId;
  await redis.set(gameId, board);

  return { board, isCorrect };
};

const updatePlayerGameScore = async ({
  gameId,
  playerId,
  score,
}: {
  gameId: string;
  playerId: string;
  score: number;
}): Promise<boolean> => {
  const redis = getRedis();
  const board = await getGameByGameId(gameId);
  if (!board) throw new Error("Game does not exist");
  if (board.state !== GameStatusEnum.InProgress)
    throw new Error("Game is not in progress");

  await redis.hincrby(getGamePlayerMapKey(gameId), playerId, score);
  return true;
};
