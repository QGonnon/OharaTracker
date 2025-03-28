<template>
  <Menu />
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MangaList from "./components/MangaList/MangaList.vue";
import Menu from "./components/Menu/Menu.vue";

export default defineComponent({
  components: {
    MangaList,
    Menu,
  },
});
</script>

<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
}
</style>
