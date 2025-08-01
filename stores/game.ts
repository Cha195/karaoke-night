import { defineStore } from "pinia";
import type { GameBoardDTO } from "~/model/game";
import { usePlayerStore } from "./player";
import type { WebSocketMessage } from "~/model/ws";
import { WebSocketMessageType } from "~/model/ws";

export const useGameStore = defineStore("game", () => {
  const playerStore = usePlayerStore();

  const gameBoard = ref<GameBoardDTO | null>(null);
  const playerNames = ref<Record<string, string>>({});
  const isLoading = ref(false);
  const error = ref<string>("");
  const socket = ref<WebSocket | null>(null);

  const isCreator = computed(() => {
    return playerStore.playerId === gameBoard.value?.creatorId;
  });

  const setGameBoard = (board: GameBoardDTO) => {
    gameBoard.value = board;
  };

  const clearGameBoard = () => {
    gameBoard.value = null;
    playerNames.value = {};
  };

  const setPlayerName = (playerId: string, name: string) => {
    playerNames.value[playerId] = name;
  };

  const connectToGame = (gameId: string) => {
    if (socket.value) return;
    const playerId = playerStore.playerId;
    if (!playerId) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/_ws`;

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log("[ws] Connected to WebSocket");
      // Send join-game message after connection is established
      newSocket.send(
        JSON.stringify({
          type: "join-game",
          gameId,
          playerId,
        })
      );
    };

    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log("[ws] Received message:", message.type);

        switch (message.type) {
          case WebSocketMessageType.GameStarted:
          case WebSocketMessageType.GameStateUpdate:
            setGameBoard(message.payload);
            break;
          case WebSocketMessageType.PlayerJoined:
            setPlayerName(message.payload.playerId, message.payload.playerName);
            break;
        }
      } catch (err) {
        console.error("[ws] Error parsing message:", err);
      }
    };

    newSocket.onerror = (error) => {
      console.error("[ws] WebSocket error:", error);
    };

    newSocket.onclose = () => {
      console.log("[ws] WebSocket connection closed");
      socket.value = null;
    };

    socket.value = newSocket;
  };

  const disconnectFromGame = () => {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
  };

  const joinGame = async (gameId: string) => {
    const playerName = playerStore.playerId;
    if (!playerName) {
      return { success: false, error: "Player name is not set." };
    }

    try {
      const response = await $fetch("/api/join-game", {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
        body: { gameId, playerName },
      });
      if (response.success && response.data) {
        setGameBoard(response.data);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      return { success: false, error: err.data?.message };
    }
  };

  const createGame = async (params: {
    artists?: string[];
    genres?: string[];
    decades?: string[];
    moods?: string[];
    limit: number;
  }) => {
    isLoading.value = true;
    error.value = "";
    try {
      const response = await $fetch("/api/create-game", {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
        body: params,
      });
      if (response.success && response.data) {
        setGameBoard(response.data);
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.message || "Failed to create game";
        error.value = errorMsg;
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg =
        err.data?.message || err.message || "Failed to create game";
      error.value = errorMsg;
      return { success: false, error: errorMsg };
    } finally {
      isLoading.value = false;
    }
  };

  const startGame = async (gameId: string) => {
    isLoading.value = true;
    error.value = "";
    try {
      const response = await $fetch("/api/start-game", {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
        query: { gameId },
      });
      if (response.success && response.data) {
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.message || "Failed to start game";
        error.value = errorMsg;
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg =
        err.data?.message || err.message || "Failed to start game";
      error.value = errorMsg;
      return { success: false, error: errorMsg };
    } finally {
      isLoading.value = false;
    }
  };

  const endGame = async (gameId: string) => {
    isLoading.value = true;
    error.value = "";
    try {
      const response = await $fetch(`/api/end-game?gameId=${gameId}`, {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
      });
      if (response.success) {
        clearGameBoard();
        disconnectFromGame();
        return { success: true };
      } else {
        const errorMsg = response.message || "Failed to end game";
        error.value = errorMsg;
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.data?.message || err.message || "Failed to end game";
      error.value = errorMsg;
      return { success: false, error: errorMsg };
    } finally {
      isLoading.value = false;
    }
  };

  const submitAnswer = async (params: {
    answer: string;
    gameId: string;
    tileId: string;
  }) => {
    error.value = "";
    try {
      const response = await $fetch("/api/submit-answer", {
        method: "POST",
        headers: playerStore.getPlayerHeaders(),
        body: params,
      });
      if (response.success && response.data) {
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.message || "Failed to submit answer";
        error.value = errorMsg;
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg =
        err.data?.message || err.message || "Failed to submit answer";
      error.value = errorMsg;
      return { success: false, error: errorMsg };
    }
  };

  return {
    gameBoard,
    playerNames,
    isLoading,
    error,
    isCreator,
    setGameBoard,
    clearGameBoard,
    setPlayerName,
    connectToGame,
    disconnectFromGame,
    joinGame,
    createGame,
    startGame,
    endGame,
    submitAnswer,
  };
});
