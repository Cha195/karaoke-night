<script setup lang="ts">
import { useGameStore } from "~/stores/game";
import { usePlayerStore } from "~/stores/player";

// Use Pinia stores
const gameStore = useGameStore();
const playerStore = usePlayerStore();

// Player name input
const playerNameInput = ref("");

// Initialize on page load
onMounted(() => {
  playerStore.initializePlayer();
  playerStore.loadPlayerName();
  playerNameInput.value = playerStore.playerName || "";
});

// Watch for player name changes
watch(playerNameInput, (newName) => {
  if (newName.trim()) {
    playerStore.setPlayerName(newName.trim());
  }
});

// Check if create game button should be disabled
const canCreateGame = computed(() => {
  return playerNameInput.value.trim().length > 0;
});

// Create game function
const handleCreateGame = async () => {
  if (!canCreateGame.value) return;

  const result = await gameStore.createGame({
    artists: ["The Weeknd"],
    limit: 25,
  });

  if (result.success) {
    // Game created successfully, state is already updated
    console.log("Game created:", result.data);
  }
  // Error handling is done in the store
};

// Start game function
const handleStartGame = async () => {
  if (!gameStore.gameBoard) return;

  const result = await gameStore.startGame(gameStore.gameBoard.gameId);

  if (result.success) {
    // Navigate to game page
    await navigateTo(`/game?gameId=${gameStore.gameBoard.gameId}`);
  }
  // Error handling is done in the store
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4"
  >
    <div
      class="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full"
    >
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white mb-2">🎤 Karaoke Night</h1>
        <p class="text-gray-300 mb-8">Test your music knowledge!</p>

        <!-- Player ID display -->
        <div class="bg-white/5 rounded-lg p-4 mb-6">
          <p class="text-sm text-gray-400 mb-1">Player ID:</p>
          <p class="text-xs text-gray-300 font-mono break-all">
            {{ playerStore.playerId }}
          </p>
        </div>

        <!-- Player Name Input -->
        <div class="mb-6">
          <label
            for="playerName"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Enter your name:
          </label>
          <input
            id="playerName"
            v-model="playerNameInput"
            type="text"
            placeholder="Your name"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            :class="{
              'border-red-400': !canCreateGame && playerNameInput.length > 0,
            }"
          />
          <p
            v-if="!canCreateGame && playerNameInput.length > 0"
            class="text-red-400 text-xs mt-1"
          >
            Please enter a valid name
          </p>
        </div>

        <!-- Error message -->
        <div
          v-if="gameStore.error"
          class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6"
        >
          <p class="text-red-300 text-sm">{{ gameStore.error }}</p>
        </div>

        <!-- Create Game Button -->
        <button
          v-if="!gameStore.gameBoard"
          @click="handleCreateGame"
          :disabled="gameStore.isLoading || !canCreateGame"
          class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <span
            v-if="gameStore.isLoading"
            class="flex items-center justify-center"
          >
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Creating Game...
          </span>
          <span v-else>🎮 Create New Game</span>
        </button>

        <!-- Start Game Button -->
        <button
          v-if="gameStore.gameBoard"
          @click="handleStartGame"
          :disabled="gameStore.isLoading"
          class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <span
            v-if="gameStore.isLoading"
            class="flex items-center justify-center"
          >
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Starting Game...
          </span>
          <span v-else>🚀 Start Game</span>
        </button>

        <!-- Game Info -->
        <div v-if="gameStore.gameBoard" class="bg-white/5 rounded-lg p-4">
          <p class="text-gray-300 text-sm">
            Game ID:
            <span class="font-mono text-xs">{{
              gameStore.gameBoard.gameId
            }}</span>
          </p>
          <p class="text-gray-300 text-sm">
            Status:
            <span class="text-yellow-400">{{ gameStore.gameBoard.state }}</span>
          </p>
          <p class="text-gray-300 text-sm">
            Tiles: {{ gameStore.gameBoard.tiles.length }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
