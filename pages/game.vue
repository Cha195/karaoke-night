<script lang="ts" setup>
import { useGameStore } from "~/stores/game";
import { usePlayerStore } from "~/stores/player";
import AppPlayerScores from "~/components/app/game/AppPlayerScores.vue";

const route = useRoute();
const gameId = route.query.gameId as string;

console.log("Game page loaded, gameId:", gameId);

// Use Pinia stores
const gameStore = useGameStore();
const playerStore = usePlayerStore();

// Dialog state
const isDialogOpen = ref(false);
const selectedTileId = ref<string | null>(null);

// Initialize on page load
onMounted(() => {
  console.log("Game page mounted");
  console.log("Initial gameBoard:", gameStore.gameBoard);
  console.log("Initial playerId:", playerStore.playerId);

  playerStore.initializePlayer();
  playerStore.loadPlayerName();

  console.log("After initialization - playerId:", playerStore.playerId);
  console.log("After initialization - gameBoard:", gameStore.gameBoard);

  if (!gameId) {
    console.error("No game ID provided");
    navigateTo("/");
  } else if (!gameStore.gameBoard) {
    console.error("No game board in state, redirecting to home");
    navigateTo("/");
  } else {
    console.log("Game board found:", gameStore.gameBoard);
  }
});

// End game function
const handleEndGame = async () => {
  console.log("Ending game with gameId:", gameId);
  const result = await gameStore.endGame(gameId);

  if (result.success) {
    console.log("Game ended successfully");
    navigateTo("/");
  } else {
    console.error("Failed to end game:", result.error);
  }
};

const clickHandler = (tileId: string) => {
  console.log("Tile clicked:", tileId);
  selectedTileId.value = tileId;
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
  selectedTileId.value = null;
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4"
  >
    <!-- Debug info -->
    <div class="fixed top-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
      <div>GameId: {{ gameId }}</div>
      <div>Has GameBoard: {{ !!gameStore.gameBoard }}</div>
      <div>PlayerId: {{ playerStore.playerId }}</div>
      <div>Loading: {{ gameStore.isLoading }}</div>
      <div>Error: {{ gameStore.error }}</div>
    </div>

    <!-- Loading state -->
    <div
      v-if="gameStore.isLoading"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"
        ></div>
        <p class="text-white">Loading game...</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="gameStore.error"
      class="flex items-center justify-center min-h-screen"
    >
      <div
        class="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md"
      >
        <p class="text-red-300 text-center">{{ gameStore.error }}</p>
        <button
          @click="handleEndGame()"
          class="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Home
        </button>
      </div>
    </div>

    <!-- Game board -->
    <div v-else-if="gameStore.gameBoard" class="container mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">🎤 Karaoke Night</h1>
        <p class="text-gray-300">Game ID: {{ gameStore.gameBoard.gameId }}</p>
        <p class="text-gray-300">Status: {{ gameStore.gameBoard.state }}</p>
        <p v-if="playerStore.playerName" class="text-gray-300">
          Player: {{ playerStore.playerName }}
        </p>
      </div>

      <!-- Player Scores -->
      <div class="mb-8 max-w-md mx-auto">
        <AppPlayerScores :player-scores="gameStore.gameBoard.playerScores" />
      </div>

      <!-- Game board grid -->
      <div class="grid grid-cols-5 gap-4 max-w-4xl mx-auto">
        <template v-for="tile in gameStore.gameBoard.tiles" :key="tile.tileId">
          <button
            @click="tile.answeredBy ? null : clickHandler(tile.tileId)"
            class="aspect-square bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all duration-200 border border-white/20"
            :class="{
              'opacity-50 cursor-not-allowed': tile.answeredBy,
              'hover:bg-white/20 hover:scale-105': !tile.answeredBy,
            }"
          >
            <div
              class="h-full flex flex-col justify-center items-center text-center"
            >
              <p class="text-white text-sm font-medium mb-2">
                {{ tile.previewUrl || "No Preview" }}
              </p>
              <p class="text-gray-400 text-xs">Points: {{ tile.points }}</p>
              <p class="text-gray-400 text-xs">{{ tile.difficulty }}</p>
            </div>
          </button>
        </template>
      </div>

      <!-- Dialog component -->
      <AppGameTileDialog
        v-if="selectedTileId !== null"
        :id="selectedTileId"
        :is-open="isDialogOpen"
        @close="closeDialog"
      />
    </div>

    <!-- No game board state -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div
        class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 max-w-md"
      >
        <p class="text-yellow-300 text-center">
          No game board found. Redirecting to home...
        </p>
        <button
          @click="navigateTo('/')"
          class="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Home
        </button>
      </div>
    </div>
  </div>
</template>

<style></style>
