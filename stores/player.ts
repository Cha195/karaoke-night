import { defineStore } from "pinia";

export const usePlayerStore = defineStore("player", () => {
  // State
  const playerId = ref<string>("");
  const playerName = ref<string>("");
  const isConnected = ref(false);
  const lastSeen = ref<Date | null>(null);

  // Debounce timer for player name
  let nameDebounceTimer: NodeJS.Timeout | null = null;

  // Initialize player ID from localStorage
  const initializePlayer = () => {
    const storedPlayerId = localStorage.getItem("player-id");
    if (storedPlayerId) {
      playerId.value = storedPlayerId;
    } else {
      const newPlayerId = crypto.randomUUID();
      localStorage.setItem("player-id", newPlayerId);
      playerId.value = newPlayerId;
    }

    // Set last seen to now
    lastSeen.value = new Date();
  };

  // Set player name with debouncing
  const setPlayerName = (name: string) => {
    playerName.value = name;

    // Clear existing timer
    if (nameDebounceTimer) {
      clearTimeout(nameDebounceTimer);
    }

    // Debounce localStorage write
    nameDebounceTimer = setTimeout(() => {
      localStorage.setItem("player-name", name);
    }, 300); // 300ms delay
  };

  // Get player name from localStorage
  const loadPlayerName = () => {
    const storedName = localStorage.getItem("player-name");
    if (storedName) {
      playerName.value = storedName;
    }
  };

  // Update connection status (for future socket implementation)
  const setConnectionStatus = (connected: boolean) => {
    isConnected.value = connected;
    if (connected) {
      lastSeen.value = new Date();
    }
  };

  // Get player info for API headers
  const getPlayerHeaders = () => ({
    "player-id": playerId.value,
    "player-name": playerName.value,
  });

  // Check if player is initialized
  const isPlayerInitialized = () => {
    return playerId.value !== "";
  };

  // Clear player data (for logout/reset)
  const clearPlayer = () => {
    playerId.value = "";
    playerName.value = "";
    isConnected.value = false;
    lastSeen.value = null;

    // Clear debounce timer
    if (nameDebounceTimer) {
      clearTimeout(nameDebounceTimer);
      nameDebounceTimer = null;
    }

    localStorage.removeItem("player-id");
    localStorage.removeItem("player-name");
  };

  return {
    // State
    playerId,
    playerName,
    isConnected,
    lastSeen,

    // Actions
    initializePlayer,
    setPlayerName,
    loadPlayerName,
    setConnectionStatus,
    getPlayerHeaders,
    isPlayerInitialized,
    clearPlayer,
  };
});
