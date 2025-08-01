<script setup lang="ts">
import { useGameStore } from "~/stores/game";
import { usePlayerStore } from "~/stores/player";

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const router = useRouter();

const gameId = ref("");
const isLoading = ref(false);
const error = ref("");

const handleJoinGame = async () => {
  if (!gameId.value.trim()) {
    error.value = "Please enter a Game ID.";
    return;
  }

  isLoading.value = true;
  error.value = "";

  // The game store needs a joinGame method
  const result = await gameStore.joinGame(gameId.value.trim());

  if (result.success) {
    await router.push("/lobby");
  } else {
    error.value =
      result.error || "Failed to join game. Please check the Game ID.";
  }

  isLoading.value = false;
};

onMounted(() => {
  playerStore.initializePlayer();
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4"
  >
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">Join a Game</h1>
        <p class="text-gray-300">Enter the Game ID from your host to join.</p>
      </div>

      <div
        class="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20"
      >
        <form @submit.prevent="handleJoinGame">
          <div class="mb-6">
            <label for="gameId" class="block text-white text-sm font-bold mb-2"
              >Game ID</label
            >
            <input
              v-model="gameId"
              type="text"
              id="gameId"
              placeholder="Enter Game ID here"
              class="w-full px-4 py-3 bg-white/10 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div
            v-if="error"
            class="mb-4 p-3 bg-red-500/30 border border-red-500 rounded text-red-200 text-sm"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-500 transition-colors"
          >
            <span v-if="isLoading">Joining...</span>
            <span v-else>Join Game</span>
          </button>
        </form>
      </div>
      <div class="text-center mt-6">
        <button
          @click="router.push('/')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  </div>
</template>
