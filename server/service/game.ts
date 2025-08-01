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

// Key for the sorted set holding player IDs for a game
const getGamePlayersKey = (gameId: string) => `game:${gameId}:players`;
// Key for the hash storing player data (name, score)
const getGamePlayerHashKey = (gameId: string) => `game:${gameId}:player_data`;
// Key for the list that stores the turn order
const getGameTurnOrderKey = (gameId: string) => `game:${gameId}:turn_order`;
// Key for the string holding the current player's ID
const getGameTurnKey = (gameId: string) => `game:${gameId}:turn`;

/**
 * Adds a player to the game's list of players.
 * Uses a Redis Set to automatically handle duplicates.
 * @param gameId - The ID of the game.
 * @param playerId - The ID of the player to add.
 */
export const addPlayerToGame = async (gameId: string, playerId: string) => {
  const redis = getRedis();
  const key = getGamePlayersKey(gameId);
  await redis.sadd(key, playerId);
};

/**
 * Retrieves the list of all players in a game.
 * @param gameId - The ID of the game.
 * @returns An array of player IDs.
 */
export const getGamePlayers = async (gameId: string) => {
  const redis = getRedis();
  const key = getGamePlayersKey(gameId);
  return await redis.smembers(key);
};

/**
 * Sets the turn order for the game.
 * For simplicity, we'll use a list to represent the queue.
 * @param gameId - The ID of the game.
 * @param players - An array of player IDs in shuffled order.
 */
export const setPlayerTurnOrder = async (gameId: string, players: string[]) => {
  const redis = getRedis();
  const key = getGameTurnOrderKey(gameId);
  await redis.del(key); // Clear existing turn order
  if (players.length > 0) {
    await redis.rpush(key, ...players);
    // Set the first player as the current turn
    await setCurrentPlayerTurn(gameId, players[0]);
  }
};

/**
 * Sets the current player for a game.
 * @param gameId - The ID of the game.
 * @param playerId - The ID of the player whose turn it is.
 */
export const setCurrentPlayerTurn = async (
  gameId: string,
  playerId: string
) => {
  const redis = getRedis();
  const key = getGameTurnKey(gameId);
  await redis.set(key, playerId);
};

/**
 * Gets the ID of the player whose turn it currently is.
 * @param gameId - The ID of the game.
 * @returns The player ID or null if not set.
 */
export const getCurrentPlayerTurn = async (gameId: string) => {
  const redis = getRedis();
  const key = getGameTurnKey(gameId);
  return await redis.get<string>(key);
};

/**
 * Advances the turn to the next player in the queue.
 * If it's the last player's turn, it circles back to the first.
 * @param gameId - The ID of the game.
 * @returns The ID of the new current player.
 */
export const advanceTurn = async (gameId: string): Promise<string | null> => {
  const redis = getRedis();
  const playersKey = getGameTurnOrderKey(gameId);

  const currentPlayerId = await getCurrentPlayerTurn(gameId);
  if (!currentPlayerId) return null; // No game in progress or no current player

  const playerQueue = await redis.lrange(playersKey, 0, -1);
  if (playerQueue.length === 0) return null;

  const currentPlayerIndex = playerQueue.indexOf(currentPlayerId);
  const nextPlayerIndex = (currentPlayerIndex + 1) % playerQueue.length;
  const nextPlayerId = playerQueue[nextPlayerIndex];

  await setCurrentPlayerTurn(gameId, nextPlayerId);

  return nextPlayerId;
};

export const generateBoard = async (
  params: StartGameParams,
  creatorId: string,
  playerName: string
): Promise<GameBoard> => {
  const query = queryGenerator(params);
  const tracks = await fetchTracks(query, params.limit);

  if (!tracks.length) throw new Error("Could not fetch tracks");

  const videoLinks = await fetchVideoLinks(tracks);
  const sortedTracks = [...tracks].sort((a, b) => a.popularity - b.popularity);

  const board: GameBoard = {
    gameId: crypto.randomUUID(),
    creatorId,
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

  await addPlayerToGame(board.gameId, creatorId);
  await updatePlayerGameScore({
    gameId: board.gameId,
    playerId: creatorId,
    score: 0,
    playerName,
  });

  return board;
};

export const gameBoardToGameBoardDTO = async (
  board: GameBoard,
  playerId: string
): Promise<GameBoardDTO> => {
  const redis = getRedis();
  const gamePlayersKey = getGamePlayerHashKey(board.gameId);
  const playerData = await redis.hgetall(gamePlayersKey);
  const currentPlayerId = await getCurrentPlayerTurn(board.gameId);

  const scores: Record<string, number> = {};
  if (playerData) {
    // hgetall can return a flat array of keys and values, or an object
    if (Array.isArray(playerData)) {
      for (let i = 0; i < playerData.length; i += 2) {
        const key = playerData[i];
        const value = playerData[i + 1] as { score: number; name: string };
        scores[key] = value.score;
      }
    } else {
      for (const [key, value] of Object.entries(playerData)) {
        scores[key] = (value as { score: number; name: string }).score;
      }
    }
  }

  return {
    playerId,
    gameId: board.gameId,
    creatorId: board.creatorId,
    state: board.state,
    tiles: board.tiles.map((tile) => ({
      tileId: tile.tileId,
      difficulty: tile.difficulty,
      points: tile.points,
      previewUrl: tile.previewUrl,
      answeredBy: tile.answeredBy,
    })),
    playerScores: scores,
    currentPlayerId: currentPlayerId ?? null,
  };
};

export const getGameByGameId = async (
  gameId: string
): Promise<GameBoard | null> => {
  const redis = getRedis();
  const stringifiedBoard = await redis.get(gameId);
  if (!stringifiedBoard) return null;

  try {
    const gameBoard: GameBoard = GameBoardSchema.parse(stringifiedBoard);
    return gameBoard;
  } catch (e) {
    console.error("Failed to parse game board from redis", e);
    return null;
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const startGameByGameId = async (
  gameId: string,
  playerId: string
): Promise<GameBoard | null> => {
  const gameBoard = await getGameByGameId(gameId);
  if (!gameBoard) throw new Error("Game does not exist");
  if (gameBoard.creatorId !== playerId) throw new Error("Unauthorized");
  if (gameBoard.state !== GameStatusEnum.Unstarted)
    throw new Error("Game state invalid");

  gameBoard.state = GameStatusEnum.InProgress;

  const players = await getGamePlayers(gameId);
  if (players.length === 0) {
    throw new Error("Cannot start a game with no players.");
  }

  const shuffledPlayers = shuffleArray(players);
  await setPlayerTurnOrder(gameId, shuffledPlayers);

  const redis = getRedis();
  await redis.set(gameId, JSON.stringify(gameBoard), {
    ex: 60 * 60 * 24,
  });
  return gameBoard;
};

export const deleteGameByGameId = async (gameId: string): Promise<void> => {
  const redis = getRedis();
  await redis.del(gameId);
  await redis.del(getGamePlayerHashKey(gameId));
  await redis.del(`game:${gameId}:turn`);
};

export const addGamePlayerMap = async ({
  gameId,
  playerId,
  playerName,
}: {
  gameId: string;
  playerId: string;
  playerName: string;
}): Promise<boolean> => {
  const board = await getGameByGameId(gameId);
  if (!board) throw new Error("Game does not exist");
  if (board.state !== GameStatusEnum.Unstarted)
    throw new Error("Game has already begun");

  const players = await getGamePlayers(gameId);
  if (players.length >= 5) {
    throw new Error("Player limit reached. Cannot join the game.");
  }

  await addPlayerToGame(gameId, playerId);
  await updatePlayerGameScore({
    gameId,
    playerId,
    playerName,
    score: 0,
  });

  return true;
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\b(ft\.|feat\.|featuring)\b/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const matchAnswer = (userAnswer: string, correctTitle: string): boolean => {
  const cleanUser = normalizeTitle(userAnswer);
  const cleanCorrect = normalizeTitle(correctTitle);
  const result = fuzzysort.single(cleanUser, cleanCorrect);
  return result !== null && result.score !== undefined && result.score > 0.5;
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

  const currentTurnPlayerId = await getCurrentPlayerTurn(gameId);
  if (currentTurnPlayerId !== playerId) {
    throw new Error("It's not your turn!");
  }

  const tile = board.tiles.find((tile) => tile.tileId === tileId);
  if (!tile) throw new Error("Wrong tile id");
  if (tile.answeredBy !== null) throw new Error("Question already answered");

  const correctTitle = tile.title;
  const isCorrect = matchAnswer(answer, correctTitle);

  tile.answeredBy = playerId;

  if (isCorrect) {
    await updatePlayerGameScore({ gameId, playerId, score: tile.points });
  }

  await advanceTurn(gameId);
  await redis.set(gameId, JSON.stringify(board));

  const updatedBoard = await getGameByGameId(gameId);
  if (!updatedBoard) throw new Error("Failed to refetch board after update");

  return { board: updatedBoard, isCorrect };
};

const updatePlayerGameScore = async ({
  gameId,
  playerId,
  score,
  playerName,
}: {
  gameId: string;
  playerId: string;
  score: number;
  playerName?: string;
}): Promise<boolean> => {
  const redis = getRedis();
  const gamePlayerKey = getGamePlayerHashKey(gameId);
  const existingPlayerData = await redis.hget<{
    score: number;
    name: string;
  }>(gamePlayerKey, playerId);

  const data = existingPlayerData ?? {
    score: 0,
    name: playerName ?? "New Player",
  };
  data.score += score;

  await redis.hset(gamePlayerKey, { [playerId]: data });
  await redis.expire(gamePlayerKey, 60 * 60 * 24);

  return true;
};
