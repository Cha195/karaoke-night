<script lang="ts" setup>
const GAME_ROWS: number = 5;
const GAME_COLS: string[] = ["🎤", "🎶", "💎", "🔥", "🌟"];

// Dialog state
const isDialogOpen = ref(false);
const selectedTileId = ref<number | null>(null);
const selectedColumnId = ref<string>(0);

const clickHandler = (index: number) => {
  selectedTileId.value = index;
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
  selectedTileId.value = null;
};
</script>

<template>
  <div
    class="min-h-screen mx-auto flex flex-col justify-center items-center w-full container p-3"
  >
    <!-- Mobile gameboard -->
    <div class="md:hidden mb-5 w-full">
      <select v-model="selectedColumnId" class="w-full text-center">
        <option v-for="(col, id) in GAME_COLS" :value="id" class="text-center">
          {{ col }}
        </option>
      </select>
    </div>
    <div class="grid md:hidden grid-cols-1 gap-5 w-full">
      <template
        v-for="row in Array.from({ length: GAME_ROWS }, (_, i) => i)"
        :key="row"
      >
        <AppGameTile :id="row * 5 + selectedColumnId" @click="clickHandler" />
      </template>
    </div>

    <!-- Desktop gameboard -->
    <div class="hidden md:grid grid-cols-5 gap-5 w-full">
      <template
        v-for="row in Array.from({ length: GAME_ROWS }, (_, i) => i)"
        :key="row"
      >
        <template v-for="(_, index) in GAME_COLS" :key="`${row}_${index}`">
          <AppGameTile :id="row * 5 + index" @click="clickHandler" />
        </template>
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
</template>

<style></style>
