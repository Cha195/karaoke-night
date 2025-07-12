<script lang="ts" setup>
const GAME_ROWS: number = 5;
const GAME_COLS: string[] = ["🎤", "🎶", "💎", "🔥", "🌟"];
</script>

<template>
  <div class="container min-h-screen mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-5">
      <template
        v-for="row in Array.from({ length: GAME_ROWS }, (_, i) => i)"
        :key="row"
      >
        <div
          v-for="(_, index) in GAME_COLS"
          :key="col"
          class="p-5 w-full bg-[#eee]"
        >
          <p class="text-center">{{ row * 5 + (index + 1) }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style></style>
