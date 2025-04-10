<script setup lang="ts">
import CursorSprite from "./components/BunnySprite.vue";
import CharacterSelect from "./components/CharacterSelect.vue";
import ConnectionIcon from "./components/ConnectionIcon.vue";
import LoginForm from "./components/LoginForm.vue";
import { useConnectionStore } from "./stores/connection";
import { usePlayerStore } from "./stores/player";
import { useWindowSize } from "@vueuse/core";
import { Application } from "vue3-pixi";

const { width: windowWidth, height: windowHeight } = useWindowSize();

// Disconnect on hot reload
const connectionStore = useConnectionStore();
connectionStore.disconnect();

const playerStore = usePlayerStore();
playerStore.verifyToken();
</script>

<template>
  <div v-if="connectionStore.isConnected" style="color: white">
    what up boi, you connected on {{ connectionStore.serverUrl }}
  </div>
  <div class="modal items-center h-screen" v-else-if="playerStore.token">
    <CharacterSelect class="login" />
  </div>
  <div class="modal flex items-center h-screen" v-else>
    <LoginForm class="login m-auto" />
  </div>
  <Application class="game" :width="windowWidth" :height="windowHeight">
    <CursorSprite :x="windowWidth / 2" :y="windowHeight / 2" />
    <CursorSprite :x="windowWidth / 3" :y="windowHeight / 3" />
    <CursorSprite :x="windowWidth / 4" :y="windowHeight / 4" />
    <CursorSprite :x="windowWidth / 5" :y="windowHeight / 5" />
    <CursorSprite :x="windowWidth / 6" :y="windowHeight / 6" />
    <CursorSprite :x="windowWidth / 7" :y="windowHeight / 7" />
    <ConnectionIcon
      :x="windowWidth - 35"
      :y="windowHeight - 35"
      :width="25"
      :height="25"
    />
  </Application>
</template>

<style lang="css" scoped>
.game {
  z-index: -1;
  position: fixed;
  top: 0;
  left: 0;
}
.modal {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
}
.login {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
