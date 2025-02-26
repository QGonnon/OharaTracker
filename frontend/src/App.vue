<template>
  <div id="app">
    <MangaList />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MangaList from "./components/MangaList.vue";

export default defineComponent({
  components: {
    MangaList,
  },
});
</script>

<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
}
</style>
