<script setup lang="ts">
import { useGameStore } from "~/stores/game";
import type { GameTileDTO } from "~/model/game";
import AppMusicPlayer from "./AppMusicPlayer.vue";

const props = defineProps<{
  id: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const gameStore = useGameStore();

// Get tile data from game store
const tile = computed(() => {
  return gameStore.gameBoard?.tiles.find((t) => t.tileId === props.id);
});

// Extract video ID from preview URL
const videoId = computed(() => {
  if (!tile.value?.previewUrl) return "";

  // Handle different YouTube URL formats
  return tile.value.previewUrl;
});

// Music player ref
const musicPlayer = ref();

// Handle music player events
const onPlayStarted = () => {
  console.log("Music started playing");
};

const onPlayEnded = () => {
  console.log("Music finished playing");
};

const onPlayerError = (message: string) => {
  console.error("Music player error:", message);
};

// Close dialog and cleanup
const closeDialog = () => {
  // Stop music if playing
  if (musicPlayer.value) {
    musicPlayer.value.stopVideo();
  }
  emit("close");
};

// Cleanup on dialog close
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen && musicPlayer.value) {
      musicPlayer.value.stopVideo();
    }
  }
);
</script>

<template>
  <div v-if="isOpen" class="dialog-overlay" @click="closeDialog">
    <div
      class="dialog-content"
      @click.stop
      :style="{
        'view-transition-name': `tile-${props.id}-dialog`,
      }"
    >
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Song Preview</h2>
        <button
          @click="closeDialog"
          class="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Tile Info -->
        <div v-if="tile" class="bg-gray-100 rounded-lg p-4">
          <div class="space-y-2">
            <p class="text-lg font-semibold text-gray-700">
              Points: {{ tile.points }}
            </p>
            <p class="text-sm text-gray-600">
              Difficulty: {{ tile.difficulty }}
            </p>
            <p v-if="tile.answeredBy" class="text-sm text-green-600">
              Answered by: {{ tile.answeredBy }}
            </p>
          </div>
        </div>

        <!-- Music Player -->
        <div v-if="videoId" class="bg-blue-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-blue-800 mb-4">
            Listen to Preview
          </h3>
          <AppMusicPlayer
            ref="musicPlayer"
            :video-id="videoId"
            :start-time="30"
            :duration="30"
            @play-started="onPlayStarted"
            @play-ended="onPlayEnded"
            @error="onPlayerError"
          />
        </div>

        <!-- No Video Available -->
        <div v-else class="bg-yellow-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-yellow-800 mb-2">
            No Preview Available
          </h3>
          <p class="text-sm text-yellow-700">
            This song doesn't have a YouTube preview available.
          </p>
        </div>

        <!-- Game Instructions -->
        <div class="bg-green-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-green-800 mb-2">How to Play</h3>
          <ul class="text-sm text-green-700 space-y-1">
            <li>• Click "Play Song" to hear a 30-second preview</li>
            <li>• Try to guess the song title and artist</li>
            <li>• You can replay the preview multiple times</li>
            <li>• Submit your answer when you're ready!</li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4">
          <button
            @click="closeDialog"
            class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

.dialog-content {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 2rem;
  max-width: 32rem;
  width: 100%;
  margin: 0 1rem;
  max-height: 90vh;
  overflow-y: auto;
  transform-origin: center;
  animation: growIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes growIn {
  from {
    opacity: 0;
    transform: scale(0.1);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
