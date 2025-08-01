<script setup lang="ts">
import { usePlayerStore } from "~/stores/player";

const playerStore = usePlayerStore();
const router = useRouter();

const playerNameInput = ref("");

onMounted(() => {
  playerStore.initializePlayer();
  playerStore.loadPlayerName();
  playerNameInput.value = playerStore.playerName || "";
});

watch(playerNameInput, (newName) => {
  if (newName.trim()) {
    playerStore.setPlayerName(newName.trim());
  }
});

const canProceed = computed(() => {
  return playerNameInput.value.trim().length > 0;
});

const handleCreateGame = async () => {
  if (!canProceed.value) return;
  await router.push("/game-prompt");
};

const handleJoinGame = async () => {
  if (!canProceed.value) return;
  await router.push("/join");
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

        <!-- Player Name Input -->
        <div class="mb-6">
          <label
            for="playerName"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Enter your name to begin:
          </label>
          <input
            id="playerName"
            v-model="playerNameInput"
            type="text"
            placeholder="Your name"
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-1 gap-4">
          <!-- Create Game Button -->
          <button
            @click="handleCreateGame"
            :disabled="!canProceed"
            class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎮 Create New Game
          </button>

          <!-- Join Game Button -->
          <button
            @click="handleJoinGame"
            :disabled="!canProceed"
            class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🤝 Join Game
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
