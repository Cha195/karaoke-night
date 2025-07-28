<script setup lang="ts">
import { useGameStore } from "~/stores/game";
import { usePlayerStore } from "~/stores/player";
import type { GameTileDTO } from "~/model/game";
import AppMusicPlayer from "./AppMusicPlayer.vue";
import confetti from "canvas-confetti";

const props = defineProps<{
  id: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const gameStore = useGameStore();
const playerStore = usePlayerStore();

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

// Answer input
const answerInput = ref("");
const isSubmitting = ref(false);
const submitError = ref("");
const showAnswerFeedback = ref(false);
const isAnswerCorrect = ref(false);
const feedbackMessage = ref("");

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

// Submit answer
const submitAnswer = async (event?: Event) => {
  // Prevent form submission if called from form
  if (event) {
    event.preventDefault();
  }

  if (!answerInput.value.trim() || !gameStore.gameBoard) return;

  isSubmitting.value = true;
  submitError.value = "";

  try {
    const result = await gameStore.submitAnswer({
      answer: answerInput.value.trim(),
      gameId: gameStore.gameBoard.gameId,
      tileId: props.id,
    });

    if (result.success) {
      console.log("Answer submitted successfully");
      showAnswerFeedback.value = true;

      console.log(result.data);

      // Check if answer was correct
      if (result.data?.isCorrect) {
        // Correct answer - show confetti and success message
        isAnswerCorrect.value = true;
        feedbackMessage.value = "🎉 Correct! Great job!";

        // Trigger confetti animation
        triggerConfetti();

        // Close dialog after 2 seconds
        setTimeout(() => {
          closeDialog();
        }, 2000);
      } else {
        // Wrong answer - show error message
        isAnswerCorrect.value = false;
        feedbackMessage.value = "❌ Wrong answer";

        // Trigger reverse confetti animation
        triggerReverseConfetti();

        // Close dialog after 2 seconds
        setTimeout(() => {
          closeDialog();
        }, 2000);
      }
    } else {
      submitError.value = result.error || "Failed to submit answer";
    }
  } catch (error) {
    console.error("Error submitting answer:", error);
    submitError.value = "Failed to submit answer";
  } finally {
    isSubmitting.value = false;
  }
};

// Close dialog and cleanup
const closeDialog = () => {
  // Stop music if playing
  if (musicPlayer.value) {
    musicPlayer.value.stopVideo();
  }
  // Clear input and errors
  answerInput.value = "";
  submitError.value = "";
  showAnswerFeedback.value = false;
  isAnswerCorrect.value = false;
  feedbackMessage.value = "";
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

// Check if tile is already answered
const isAnswered = computed(() => {
  return (
    tile.value?.answeredBy !== null && tile.value?.answeredBy !== undefined
  );
});

// Check if current user answered this tile
const isAnsweredByCurrentUser = computed(() => {
  return tile.value?.answeredBy === playerStore.playerId;
});

// Confetti animation function
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
};

// Reverse confetti animation for wrong answers
const triggerReverseConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    gravity: -0.5,
    startVelocity: 30,
    scalar: 0.8,
    origin: { y: 1 }, // start from bottom
  });
};
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
            <p v-if="isAnswered" class="text-sm text-green-600">
              Answered by: {{ tile.answeredBy }}
            </p>
          </div>
        </div>

        <!-- Music Player -->
        <div v-if="videoId && !isAnswered" class="bg-blue-50 rounded-lg p-6">
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

        <!-- Already Answered Message -->
        <div v-if="isAnswered" class="bg-yellow-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-yellow-800 mb-2">
            {{
              isAnsweredByCurrentUser
                ? "You answered this tile!"
                : "Already Answered"
            }}
          </h3>
        </div>

        <!-- No Video Available -->
        <div
          v-else-if="!videoId && !isAnswered"
          class="bg-yellow-50 rounded-lg p-6"
        >
          <h3 class="text-lg font-semibold text-yellow-800 mb-2">
            No Preview Available
          </h3>
          <p class="text-sm text-yellow-700">
            This song doesn't have a YouTube preview available.
          </p>
        </div>

        <!-- Answer Input -->
        <div
          v-if="!isAnswered && !showAnswerFeedback"
          class="bg-green-50 rounded-lg p-4"
        >
          <h3 class="text-lg font-semibold text-green-800 mb-4">Your Answer</h3>
          <div class="space-y-3">
            <input
              v-model="answerInput"
              type="text"
              placeholder="Enter song title and artist..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              :disabled="isSubmitting"
              @keyup.enter="submitAnswer"
            />
            <p class="text-xs text-gray-600">Example: "Blinding Lights"</p>

            <!-- Submit Error -->
            <div
              v-if="submitError"
              class="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm"
            >
              {{ submitError }}
            </div>
          </div>
        </div>

        <!-- Answer Feedback -->
        <div
          v-if="showAnswerFeedback"
          class="rounded-lg p-6 text-center"
          :class="{
            'bg-green-100 border border-green-300': isAnswerCorrect,
            'bg-red-100 border border-red-300': !isAnswerCorrect,
          }"
        >
          <div class="text-2xl mb-2">
            {{ isAnswerCorrect ? "🎉" : "❌" }}
          </div>
          <h3
            class="text-lg font-semibold mb-2"
            :class="{
              'text-green-800': isAnswerCorrect,
              'text-red-800': !isAnswerCorrect,
            }"
          >
            {{ isAnswerCorrect ? "Correct!" : "Wrong Answer" }}
          </h3>
          <p
            class="text-sm"
            :class="{
              'text-green-700': isAnswerCorrect,
              'text-red-700': !isAnswerCorrect,
            }"
          >
            {{ feedbackMessage }}
          </p>
          <p class="text-xs text-gray-500 mt-2">Closing in 2 seconds...</p>
        </div>

        <!-- Game Instructions -->
        <div v-if="!isAnswered" class="bg-blue-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-blue-800 mb-2">How to Play</h3>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>• Click "Play Song" to hear a 30-second preview</li>
            <li>• Try to guess the song title and artist</li>
            <li>• You can replay the preview multiple times</li>
            <li>• Submit your answer when you're ready!</li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4">
          <button
            @click.prevent="closeDialog"
            class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            v-if="!isAnswered"
            @click.prevent="submitAnswer"
            :disabled="!answerInput.trim() || isSubmitting"
            class="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg
              v-if="isSubmitting"
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
            {{ isSubmitting ? "Submitting..." : "Submit Answer" }}
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
