<script setup lang="ts">
const props = defineProps(["id"]);
const emit = defineEmits<{
  click: [id: number];
}>();
</script>

<template>
  <button
    :key="props.id"
    class="py-10 px-5 w-full bg-[#eee] hover:scale-110 ease-in-out transition-all duration-200 cursor-pointer disabled:cursor-none"
    @click="emit('click', props.id)"
    :style="{ 'view-transition-name': `tile-${props.id}` }"
  >
    <p class="w-full h-full">{{ props.id }}</p>
  </button>
</template>
