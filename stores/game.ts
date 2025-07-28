import { defineStore } from "pinia";
import type { GameBoardDTO } from "~/model/game";
import { usePlayerStore } from "./player";

export const useGameStore = defineStore("game", () => {
  // Use player store
  const playerStore = usePlayerStore();

  // Game state
  const gameBoard = ref<GameBoardDTO | null>(null);
  const isLoading = ref(false);
  const error = ref<string>("");

  // Set game board (used after create-game API call)
  const setGameBoard = (board: GameBoardDTO) => {
    console.log("setGameBoard called with:", board);
    gameBoard.value = board;
    console.log("gameBoard.value after set:", gameBoard.value);
  };

  // Clear game board (used when ending game)
  const clearGameBoard = () => {
    gameBoard.value = null;
  };

  // Set loading state
  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  // Set error
  const setError = (err: string) => {
    error.value = err;
  };

  // Clear error
  const clearError = () => {
    error.value = "";
  };

  // Get current game ID
  const getGameId = () => {
    return gameBoard.value?.gameId || null;
  };

  // Check if user is in a game
  const isInGame = () => {
    return gameBoard.value !== null;
  };

  // Create game API call
  const createGame = async (params: {
    artists?: string[];
    genres?: string[];
    decades?: string[];
    moods?: string[];
    limit: number;
  }) => {
    setLoading(true);
    clearError();

    try {
      console.log("Creating game with params:", params);
      console.log("Player headers:", playerStore.getPlayerHeaders());

      const response = await $fetch("/api/create-game", {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
        body: params,
      });

      console.log("Create game response:", response);

      if (response.success && response.data) {
        console.log("Setting game board:", response.data);
        setGameBoard(response.data);
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.message || "Failed to create game";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create game";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Start game API call
  const startGame = async (gameId: string) => {
    setLoading(true);
    clearError();

    try {
      const response = await $fetch("/api/start-game", {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
        query: { gameId },
      });

      if (response.success) {
        return { success: true };
      } else {
        const errorMsg = response.message || "Failed to start game";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to start game";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // End game API call
  const endGame = async (gameId: string) => {
    setLoading(true);
    clearError();

    try {
      const response = await $fetch(`/api/end-game?gameId=${gameId}`, {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
      });

      if (response.success) {
        clearGameBoard();
        return { success: true };
      } else {
        const errorMsg = response.message || "Failed to end game";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to end game";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Submit answer API call
  const submitAnswer = async (params: {
    answer: string;
    gameId: string;
    tileId: string;
  }) => {
    clearError();

    try {
      const response = await $fetch("/api/submit-answer", {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
        body: params,
      });

      if (response.success && response.data) {
        setGameBoard(response.data.board);
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.message || "Failed to submit answer";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to submit answer";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return {
    // State
    gameBoard,
    isLoading,
    error,

    // Game actions
    setGameBoard,
    clearGameBoard,
    setLoading,
    setError,
    clearError,
    getGameId,
    isInGame,

    // API actions
    createGame,
    startGame,
    endGame,
    submitAnswer,
  };
});
