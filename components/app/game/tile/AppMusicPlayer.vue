<script setup lang="ts">
interface Props {
  videoId: string;
  startTime?: number;
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  startTime: 30,
  duration: 30,
});

const emit = defineEmits<{
  "play-started": [];
  "play-ended": [];
  error: [message: string];
}>();

// State
const player = ref<any>(null);
const isPlayerReady = ref(false);
const isPlaying = ref(false);
const retryCount = ref(0);
const maxRetries = 3;
const stopTimer = ref<NodeJS.Timeout | null>(null);
const playerContainer = ref<HTMLElement>();

// YouTube API loading
const isYouTubeAPIReady = ref(false);

// Load YouTube API
const loadYouTubeAPI = () => {
  if (typeof window !== "undefined" && !window.YT) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    // Set up global callback
    window.onYouTubeIframeAPIReady = () => {
      isYouTubeAPIReady.value = true;
      initializePlayer();
    };
  } else if (window.YT) {
    isYouTubeAPIReady.value = true;
    initializePlayer();
  }
};

// Initialize YouTube player
const initializePlayer = () => {
  if (!isYouTubeAPIReady.value || !playerContainer.value) return;

  try {
    player.value = new window.YT.Player(playerContainer.value, {
      height: "1",
      width: "1",
      videoId: props.videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        start: props.startTime,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        fs: 0,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  } catch (error) {
    console.error("Failed to initialize player:", error);
    handleError("Failed to initialize player");
  }
};

// Player event handlers
const onPlayerReady = () => {
  console.log("Player ready");
  isPlayerReady.value = true;
  retryCount.value = 0;
};

const onPlayerStateChange = (event: any) => {
  console.log("Player state changed:", event.data);

  if (event.data === window.YT.PlayerState.PLAYING) {
    console.log("Video is playing");
    isPlaying.value = true;
    emit("play-started");

    // Unmute and set timer to stop
    player.value.unMute();
    stopTimer.value = setTimeout(() => {
      stopVideo();
      console.log("Stopped video after duration");
    }, props.duration * 1000);
  } else if (
    event.data === window.YT.PlayerState.ENDED ||
    event.data === window.YT.PlayerState.PAUSED
  ) {
    isPlaying.value = false;
    if (stopTimer.value) {
      clearTimeout(stopTimer.value);
      stopTimer.value = null;
    }
    emit("play-ended");
  }
};

const onPlayerError = (event: any) => {
  console.error("Player error:", event.data);
  isPlaying.value = false;

  // Handle different error types
  let errorMessage = "Failed to play video";
  switch (event.data) {
    case 2:
      errorMessage = "Invalid video ID";
      break;
    case 5:
      errorMessage = "HTML5 player error";
      break;
    case 100:
      errorMessage = "Video not found";
      break;
    case 101:
    case 150:
      errorMessage = "Video embedding not allowed";
      break;
  }

  handleError(errorMessage);
};

// Play video
const playVideo = () => {
  if (!player.value || !isPlayerReady.value) {
    console.log("Player not ready, retrying...");
    if (retryCount.value < maxRetries) {
      retryCount.value++;
      setTimeout(() => {
        initializePlayer();
      }, 1000);
    } else {
      handleError("Failed to initialize player after retries");
    }
    return;
  }

  try {
    console.log("Button clicked - attempting to play");
    player.value.mute(); // Important: mute first to allow autoplay
    player.value.seekTo(props.startTime);
    player.value.playVideo();
  } catch (error) {
    console.error("Failed to play video:", error);
    handleError("Failed to play video");
  }
};

// Stop video
const stopVideo = () => {
  if (player.value && player.value.stopVideo) {
    player.value.stopVideo();
  }
  isPlaying.value = false;
  if (stopTimer.value) {
    clearTimeout(stopTimer.value);
    stopTimer.value = null;
  }
};

// Handle errors
const handleError = (message: string) => {
  console.error("Music player error:", message);
  emit("error", message);
};

// Cleanup
const destroyPlayer = () => {
  if (player.value && player.value.destroy) {
    player.value.destroy();
    player.value = null;
  }
  if (stopTimer.value) {
    clearTimeout(stopTimer.value);
    stopTimer.value = null;
  }
  isPlayerReady.value = false;
  isPlaying.value = false;
  retryCount.value = 0;
};

// Initialize on mount
onMounted(() => {
  loadYouTubeAPI();
});

// Cleanup on unmount
onUnmounted(() => {
  destroyPlayer();
});

// Expose methods
defineExpose({
  playVideo,
  stopVideo,
  destroyPlayer,
});
</script>

<template>
  <div class="music-player">
    <!-- Hidden player container -->
    <div
      ref="playerContainer"
      class="w-1 h-1 overflow-hidden absolute -top-10 -left-10"
    ></div>

    <!-- Play button -->
    <button
      @click="playVideo"
      :disabled="!isPlayerReady || isPlaying"
      class="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors duration-200 flex items-center gap-2"
    >
      <svg
        v-if="!isPlaying"
        class="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
          clip-rule="evenodd"
        />
      </svg>
      <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ isPlaying ? "Playing..." : "Play Song" }}
    </button>

    <!-- Loading indicator -->
    <div
      v-if="!isPlayerReady && retryCount < maxRetries"
      class="mt-2 text-sm text-gray-500"
    >
      Loading player...
      {{ retryCount > 0 ? `(Retry ${retryCount}/${maxRetries})` : "" }}
    </div>

    <!-- Error message -->
    <div v-if="retryCount >= maxRetries" class="mt-2 text-sm text-red-500">
      Failed to load player after {{ maxRetries }} attempts
    </div>
  </div>
</template>

<style scoped>
.music-player {
  @apply flex flex-col items-center;
}
</style>
