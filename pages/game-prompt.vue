<script setup lang="ts">
import { usePlayerStore } from "~/stores/player";
import { useGameStore } from "~/stores/game";

const playerStore = usePlayerStore();
const gameStore = useGameStore();

// Form state
const gamePrompt = ref("");
const isProcessing = ref(false);
const error = ref("");

// Example prompts
const examplePrompts = [
  "Create a game with popular songs from The Weeknd",
  "I want a game with 80s rock music",
  "Make a game with happy pop songs from the 2010s",
  "I want to play songs from Taylor Swift and Ed Sheeran",
  "Create a game with classic rock from the 70s",
];

// Process the game prompt and create game
const processGamePrompt = async () => {
  if (!gamePrompt.value.trim()) return;

  isProcessing.value = true;
  error.value = "";

  try {
    const response = await $fetch<{
      success: boolean;
      data?: any;
      message?: string;
    }>("/api/process-game-prompt", {
      method: "POST",
      headers: playerStore.getPlayerHeaders(),
      body: {
        prompt: gamePrompt.value.trim(),
      },
    });

    if (response.success && response.data) {
      // Set the game board directly in the store
      gameStore.setGameBoard(response.data);
      console.log("Game created successfully:", response.data);
    } else {
      error.value = response.message || "Failed to create game";
    }
  } catch (err: any) {
    console.error("Error creating game:", err);
    error.value = err.message || "Failed to create game";
  } finally {
    isProcessing.value = false;
  }
};

// Start game function
const handleStartGame = async () => {
  if (!gameStore.gameBoard) return;

  isProcessing.value = true;
  error.value = "";

  try {
    const result = await gameStore.startGame(gameStore.gameBoard.gameId);

    if (result.success) {
      // Navigate to game page
      await navigateTo(`/game?gameId=${gameStore.gameBoard.gameId}`);
    } else {
      error.value = result.error || "Failed to start game";
    }
  } catch (err: any) {
    console.error("Error starting game:", err);
    error.value = err.message || "Failed to start game";
  } finally {
    isProcessing.value = false;
  }
};

// Use example prompt
const useExamplePrompt = (prompt: string) => {
  gamePrompt.value = prompt;
};

// Initialize player on mount
onMounted(() => {
  playerStore.initializePlayer();
  playerStore.loadPlayerName();
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4"
  >
    <div class="max-w-2xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">🎤 Karaoke Night</h1>
        <p class="text-gray-300">Describe your perfect karaoke game</p>
        <p v-if="playerStore.playerName" class="text-gray-400 text-sm mt-2">
          Player: {{ playerStore.playerName }}
        </p>
      </div>

      <!-- Main Form -->
      <div
        class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
      >
        <h2 class="text-xl font-semibold text-white mb-4">
          What kind of game do you want?
        </h2>

        <!-- Prompt Input -->
        <div class="mb-6">
          <div class="relative">
            <textarea
              v-model="gamePrompt"
              placeholder="Describe your ideal karaoke game... e.g., 'Create a game with popular songs from The Weeknd'"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="4"
              :disabled="isProcessing"
            ></textarea>

            <!-- Submit Button -->
            <button
              @click="processGamePrompt"
              :disabled="!gamePrompt.trim() || isProcessing"
              class="absolute bottom-3 right-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg
                v-if="isProcessing"
                class="animate-spin h-4 w-4"
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
              {{ isProcessing ? "Creating Game..." : "Create Game" }}
            </button>
          </div>
        </div>

        <!-- Example Prompts -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-300 mb-3">
            Try these examples:
          </h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="prompt in examplePrompts"
              :key="prompt"
              @click="useExamplePrompt(prompt)"
              class="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1 rounded-full transition-colors"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <!-- Error Display -->
        <div
          v-if="error"
          class="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm"
        >
          {{ error }}
        </div>

        <!-- Start Game Button -->
        <div v-if="gameStore.gameBoard" class="mt-6">
          <button
            @click="handleStartGame"
            :disabled="isProcessing"
            class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <span v-if="isProcessing" class="flex items-center justify-center">
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
          <div class="bg-white/5 rounded-lg p-4">
            <p class="text-gray-300 text-sm">
              Game ID:
              <span class="font-mono text-xs">{{
                gameStore.gameBoard.gameId
              }}</span>
            </p>
            <p class="text-gray-300 text-sm">
              Status:
              <span class="text-yellow-400">{{
                gameStore.gameBoard.state
              }}</span>
            </p>
            <p class="text-gray-300 text-sm">
              Tiles: {{ gameStore.gameBoard.tiles.length }}
            </p>
          </div>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="text-center mt-6">
        <button
          @click="navigateTo('/')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  </div>
</template>
