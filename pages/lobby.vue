<script setup lang="ts">
import { usePlayerStore } from "~/stores/player";
import { useGameStore } from "~/stores/game";
import { watch } from "vue";

const playerStore = usePlayerStore();
const gameStore = useGameStore();
const router = useRouter();

const isProcessing = ref(false);
const error = ref("");

const handleStartGame = async () => {
  if (!gameStore.gameBoard) return;
  isProcessing.value = true;
  error.value = "";
  try {
    const result = await gameStore.startGame(gameStore.gameBoard.gameId);
    if (!result.success) {
      error.value = result.error || "Failed to start game";
    }
  } catch (err: any) {
    error.value = err.message || "Failed to start game";
  } finally {
    isProcessing.value = false;
  }
};

onMounted(() => {
  playerStore.initializePlayer();
  if (gameStore.gameBoard) {
    gameStore.connectToGame(gameStore.gameBoard.gameId);
  } else {
    // If there's no game board, you shouldn't be here.
    router.push("/");
  }
});

onUnmounted(() => {
  gameStore.disconnectFromGame();
});

watch(
  () => gameStore.gameBoard?.state,
  (newState) => {
    if (newState === "In-Progress") {
      router.push(`/game?gameId=${gameStore.gameBoard?.gameId}`);
    }
  }
);
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4"
  >
    <div class="max-w-2xl w-full">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">🎤 Game Lobby 🎤</h1>
      </div>

      <div
        class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
      >
        <div v-if="gameStore.gameBoard">
          <h2 class="text-2xl text-white font-bold text-center">
            Waiting for players...
          </h2>
          <div class="bg-black/20 rounded-lg p-4 my-4 text-center">
            <p class="text-gray-300">Share this Game ID:</p>
            <p class="font-mono text-lg text-white break-all">
              {{ gameStore.gameBoard.gameId }}
            </p>
          </div>

          <!-- Player List -->
          <div class="my-6">
            <h3 class="text-lg text-white font-semibold mb-3">
              Players in Lobby:
            </h3>
            <ul class="space-y-2">
              <li
                v-for="(name, id) in gameStore.playerNames"
                :key="id"
                class="bg-white/5 p-3 rounded-lg flex items-center justify-between"
              >
                <span class="text-white">{{ name }}</span>
                <span
                  v-if="id === gameStore.gameBoard.creatorId"
                  class="text-xs text-yellow-400 font-bold"
                  >(Host)</span
                >
              </li>
            </ul>
          </div>

          <button
            v-if="gameStore.isCreator"
            @click="handleStartGame"
            :disabled="isProcessing"
            class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            🚀 Start Game for Everyone
          </button>
          <p v-else class="text-yellow-300 text-center my-4">
            Waiting for the host to start the game...
          </p>
        </div>
        <div v-else class="text-center text-white">
          Loading lobby information...
        </div>
      </div>
    </div>
  </div>
</template>
