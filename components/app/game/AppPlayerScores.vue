<script setup lang="ts">
import { usePlayerStore } from "~/stores/player";

interface PlayerScore {
  playerId: string;
  score: number;
  isCurrentUser: boolean;
}

interface Props {
  playerScores: Record<string, number>;
}

const props = defineProps<Props>();
const playerStore = usePlayerStore();

// Convert player scores to array and sort by score (descending)
const sortedPlayerScores = computed(() => {
  const scores: PlayerScore[] = Object.entries(props.playerScores).map(
    ([playerId, score]) => ({
      playerId,
      score,
      isCurrentUser: playerId === playerStore.playerId,
    })
  );

  return scores.sort((a, b) => b.score - a.score);
});

// Get current user's score and rank
const currentUserScore = computed(() => {
  return sortedPlayerScores.value.find((p) => p.isCurrentUser);
});

const currentUserRank = computed(() => {
  const currentUser = currentUserScore.value;
  if (!currentUser) return null;

  return (
    sortedPlayerScores.value.findIndex(
      (p) => p.playerId === currentUser.playerId
    ) + 1
  );
});
</script>

<template>
  <div
    class="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
  >
    <h3 class="text-lg font-semibold text-white mb-4">🏆 Player Scores</h3>

    <!-- Current User Score -->
    <div
      v-if="currentUserScore"
      class="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-green-400 font-bold">#{{ currentUserRank }}</span>
          <span class="text-green-300 font-medium">You</span>
        </div>
        <span class="text-green-400 font-bold text-lg"
          >{{ currentUserScore.score }} pts</span
        >
      </div>
    </div>

    <!-- All Player Scores -->
    <div class="space-y-2">
      <div
        v-for="(player, index) in sortedPlayerScores"
        :key="player.playerId"
        class="flex items-center justify-between p-2 rounded-lg transition-colors"
        :class="{
          'bg-green-500/10 border border-green-500/20': player.isCurrentUser,
          'bg-white/5 hover:bg-white/10': !player.isCurrentUser,
        }"
      >
        <div class="flex items-center gap-3">
          <!-- Rank -->
          <div
            class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
            :class="{
              'bg-yellow-500 text-yellow-900': index === 0,
              'bg-gray-400 text-gray-900': index === 1,
              'bg-orange-500 text-orange-900': index === 2,
              'bg-blue-500 text-blue-900': index > 2,
            }"
          >
            {{ index + 1 }}
          </div>

          <!-- Player Name/ID -->
          <span
            class="text-sm font-medium"
            :class="{
              'text-green-300': player.isCurrentUser,
              'text-gray-300': !player.isCurrentUser,
            }"
          >
            {{
              player.isCurrentUser
                ? "You"
                : `Player ${player.playerId.slice(0, 8)}`
            }}
          </span>
        </div>

        <!-- Score -->
        <span
          class="text-sm font-bold"
          :class="{
            'text-green-400': player.isCurrentUser,
            'text-gray-400': !player.isCurrentUser,
          }"
        >
          {{ player.score }} pts
        </span>
      </div>
    </div>

    <!-- No Players Message -->
    <div
      v-if="sortedPlayerScores.length === 0"
      class="text-center text-gray-400 text-sm py-4"
    >
      No players yet
    </div>
  </div>
</template>
