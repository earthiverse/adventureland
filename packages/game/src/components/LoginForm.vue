<script setup lang="ts">
import { usePlayerStore } from "@/stores/player";
import { ref } from "vue";

const playerStore = usePlayerStore();

const email = ref("");
const password = ref("");
const errorMessage = ref("");

const handleLogin = async () => {
  try {
    await playerStore.login(email.value, password.value);
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unknown error (3)";
    return;
  }
};
</script>

<template>
  <form @submit.prevent="handleLogin()" class="flex flex-col gap-2 p-4">
    <div v-if="errorMessage" class="text-red-900">
      {{ errorMessage }}
    </div>
    <div>
      <label for="email">Email:</label>
      <input id="email" v-model="email" type="text" required />
    </div>
    <div>
      <label for="password">Password:</label>
      <input id="password" v-model="password" type="password" required />
    </div>
    <div class="mt-1">
      <button type="submit">Login</button>
    </div>
  </form>
</template>
