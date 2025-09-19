<template>
  <div id="app">
    <MangaList />
    <!-- <Login /> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MangaList from "./components/MangasCoverView/MangasCoverView.vue";
import Login from "./components/Login/Login.vue";

export default defineComponent({
  components: {
    MangaList,
    Login,
  },
});
</script>

<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
}
</style>
