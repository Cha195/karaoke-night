<script setup lang="ts">
const props = defineProps<{
  id: number;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const closeDialog = () => {
  emit("close");
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
        <h2 class="text-2xl font-bold text-gray-800">Tile Details</h2>
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

      <div class="space-y-4">
        <div class="bg-gray-100 rounded-lg p-4">
          <p class="text-lg font-semibold text-gray-700">
            Tile ID: {{ props.id }}
          </p>
        </div>

        <div class="bg-blue-50 rounded-lg p-4">
          <p class="text-sm text-blue-700">
            This is tile number {{ props.id }}. You can add more content here
            like song information, game rules, or any other details you want to
            display.
          </p>
        </div>

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
            Action
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
  max-width: 28rem;
  width: 100%;
  margin: 0 1rem;
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
