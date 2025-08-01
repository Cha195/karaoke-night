<script lang="ts" setup>
import { useGameStore } from "~/stores/game";
import { usePlayerStore } from "~/stores/player";
import AppPlayerScores from "~/components/app/game/AppPlayerScores.vue";

const route = useRoute();
const gameId = route.query.gameId as string;

const gameStore = useGameStore();
const playerStore = usePlayerStore();

const isDialogOpen = ref(false);
const selectedTileId = ref<string | null>(null);

// Computed property to check if it's the current user's turn
const isMyTurn = computed(() => {
  return (
    gameStore.gameBoard?.currentPlayerId === playerStore.playerId &&
    gameStore.gameBoard?.state === "In-Progress"
  );
});

// Get the name of the current player
const currentPlayerName = computed(() => {
  if (!gameStore.gameBoard || !gameStore.gameBoard.currentPlayerId)
    return "N/A";
  // This is a simplification. A real app would have a map of player IDs to names.
  // For now, we'll indicate if it's the current user.
  if (gameStore.gameBoard.currentPlayerId === playerStore.playerId) {
    return `${playerStore.playerName} (You)`;
  }
  return `Player ${gameStore.gameBoard.currentPlayerId.substring(0, 8)}`;
});

onMounted(() => {
  playerStore.initializePlayer();
  playerStore.loadPlayerName();

  if (!gameId) {
    console.error("No game ID provided, redirecting...");
    navigateTo("/");
    return;
  }
  if (!gameStore.gameBoard) {
    console.error("No game board in state, redirecting...");
    navigateTo("/");
    return;
  }

  // Connect to the WebSocket server
  gameStore.connectToGame(gameId);
});

onUnmounted(() => {
  // Disconnect from WebSocket when leaving the page
  gameStore.disconnectFromGame();
});

const handleEndGame = async () => {
  const result = await gameStore.endGame(gameId);
  if (result.success) {
    navigateTo("/");
  } else {
    console.error("Failed to end game:", result.error);
  }
};

const clickHandler = (tileId: string) => {
  if (!isMyTurn.value) return;
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
    <div
      class="fixed top-4 left-4 bg-black/50 text-white p-2 rounded text-xs z-50"
    >
      <div>GameId: {{ gameId }}</div>
      <div>PlayerId: {{ playerStore.playerId }}</div>
      <div>Is My Turn: {{ isMyTurn }}</div>
      <div>Current Player: {{ gameStore.gameBoard?.currentPlayerId }}</div>
    </div>

    <!-- Loading, Error, No Game Board states remain the same -->
    <div
      v-if="gameStore.isLoading"
      class="flex items-center justify-center min-h-screen"
    >
      <!-- ... loading spinner ... -->
    </div>
    <div
      v-else-if="gameStore.error"
      class="flex items-center justify-center min-h-screen"
    >
      <!-- ... error message ... -->
    </div>

    <!-- Game board -->
    <div v-else-if="gameStore.gameBoard" class="container mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">🎤 Karaoke Night</h1>
        <p class="text-gray-300">Game ID: {{ gameStore.gameBoard.gameId }}</p>
        <div
          v-if="gameStore.gameBoard.state === 'In-Progress'"
          class="mt-4 p-3 rounded-lg text-lg transition-all"
          :class="
            isMyTurn
              ? 'bg-green-500/30 text-green-200'
              : 'bg-yellow-500/30 text-yellow-200'
          "
        >
          <p v-if="isMyTurn" class="font-bold animate-pulse">It's your turn!</p>
          <p v-else>
            Waiting for
            <span class="font-bold">{{ currentPlayerName }}</span> to play...
          </p>
        </div>
      </div>

      <!-- Player Scores -->
      <div class="mb-8 max-w-md mx-auto">
        <AppPlayerScores :player-scores="gameStore.gameBoard.playerScores" />
      </div>

      <!-- Game board grid -->
      <div class="grid grid-cols-5 gap-4 max-w-4xl mx-auto">
        <template v-for="tile in gameStore.gameBoard.tiles" :key="tile.tileId">
          <button
            @click="clickHandler(tile.tileId)"
            class="aspect-square bg-white/10 backdrop-blur-sm rounded-lg p-4 transition-all duration-200 border border-white/20"
            :disabled="!!tile.answeredBy || !isMyTurn"
            :class="{
              'opacity-50 cursor-not-allowed': !!tile.answeredBy || !isMyTurn,
              'hover:bg-white/20 hover:scale-105': !tile.answeredBy && isMyTurn,
            }"
          >
            <div
              class="h-full flex flex-col justify-center items-center text-center"
            >
              <p class="text-white text-3xl font-bold">
                {{ tile.points }}
              </p>
              <p class.growing="text-gray-400 text-xs mt-2">
                {{ tile.difficulty }}
              </p>
            </div>
          </button>
        </template>
      </div>

      <!-- End Game Button -->
      <div class="text-center mt-8">
        <button
          @click="handleEndGame"
          :disabled="!isMyTurn"
          class="bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed hover:enabled:bg-red-700"
        >
          End Game
        </button>
      </div>

      <!-- Dialog component -->
      <AppGameTileDialog
        v-if="selectedTileId !== null"
        :id="selectedTileId"
        :is-open="isDialogOpen"
        @close="closeDialog"
      />
    </div>

    <div v-else class="flex items-center justify-center min-h-screen">
      <!-- ... no game board message ... -->
    </div>
  </div>
</template>
<style></style>
