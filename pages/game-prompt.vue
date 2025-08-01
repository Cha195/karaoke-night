<script setup lang="ts">
import { usePlayerStore } from "~/stores/player";
import { useGameStore } from "~/stores/game";

const playerStore = usePlayerStore();
const gameStore = useGameStore();
const router = useRouter();

const gamePrompt = ref("");
const isProcessing = ref(false);
const error = ref("");

const examplePrompts = [
  "Create a game with popular songs from The Weeknd",
  "I want a game with 80s rock music",
  "Make a game with happy pop songs from the 2010s",
];

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
      body: { prompt: gamePrompt.value.trim() },
    });

    if (response.success && response.data) {
      gameStore.setGameBoard(response.data);
      await router.push("/lobby");
    } else {
      error.value = response.message || "Failed to create game";
    }
  } catch (err: any) {
    error.value = err.data?.message || "An unknown error occurred";
  } finally {
    isProcessing.value = false;
  }
};

const useExamplePrompt = (prompt: string) => {
  gamePrompt.value = prompt;
};

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
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-white mb-2">🎤 Create a Game 🎤</h1>
        <p class="text-gray-300">
          Describe your perfect karaoke game and let AI do the rest.
        </p>
      </div>

      <div
        class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
      >
        <div>
          <h2 class="text-xl font-semibold text-white mb-4">
            What kind of game do you want?
          </h2>
          <div class="mb-6">
            <div class="relative">
              <textarea
                v-model="gamePrompt"
                placeholder="e.g., 'A game with 90s alternative rock'"
                class="w-full px-4 py-3 bg-white/10 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                :disabled="isProcessing"
              ></textarea>
              <button
                @click="processGamePrompt"
                :disabled="!gamePrompt.trim() || isProcessing"
                class="absolute bottom-3 right-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {{ isProcessing ? "Creating..." : "Create Game" }}
              </button>
            </div>
          </div>
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-300 mb-3">
              Or try an example:
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="prompt in examplePrompts"
                :key="prompt"
                @click="useExamplePrompt(prompt)"
                class="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1 rounded-full"
              >
                {{ prompt }}
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="error"
          class="mt-4 p-3 bg-red-500/30 border border-red-500 rounded text-red-200 text-sm"
        >
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>
