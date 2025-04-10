<script setup lang="ts">
import { useConnectionStore } from "@/stores/connection";
import { computed } from "vue";

defineProps<{
  width: number;
  height: number;
}>();

const connectionStore = useConnectionStore();

const texture = computed(
  () =>
    `/images/ui/${connectionStore.isConnected ? "connected" : "disconnected"}.svg`,
);
</script>

<template>
  <Sprite :texture="texture" :width="width" :height="height" />
</template>
