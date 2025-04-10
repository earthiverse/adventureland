<script setup lang="ts">
import { config } from "@/config";
import { useConnectionStore } from "@/stores/connection";
import { usePlayerStore } from "@/stores/player";
import type { CharacterData } from "@adventureland/types";
import { ref } from "vue";

const connectionStore = useConnectionStore();
const playerStore = usePlayerStore();

const characters = ref<Pick<CharacterData, "id" | "name">[]>([]);

fetch(config.centralServer + "/api/getCharacters", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ token: playerStore.token }),
}).then(async (charactersResponse) => {
  if (charactersResponse.ok) {
    characters.value =
      (await charactersResponse.json()) as typeof characters.value;
  }
});

async function login(characterId: string) {
  await connectionStore.connect(
    "http://localhost:8081",
    playerStore.token,
    characterId,
  );
}
// TODO: Error handling
</script>

<template>
  <ul>
    <li
      v-for="character in characters"
      :key="character.id"
      @click="login(character.id)"
    >
      {{ character }}
    </li>
  </ul>
</template>

<style lang="css" scoped>
* {
  color: white;
}
</style>
