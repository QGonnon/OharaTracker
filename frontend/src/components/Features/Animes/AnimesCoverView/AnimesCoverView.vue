<template>
  <Menu />
  <div id="AnimeList">
    <h1 class="text-center">Dernières sorties</h1>
    <div class="container">
      <div v-if="loading">Chargement...</div>
        <div v-else v-for="manga in mangas" :key="manga.id" class="mb-6">
          <AnimeCard :manga="manga" />
        </div>
    </div>
  </div>
</template>
   
<style scoped>
@import url('./AnimesCoverView.css');
</style>

<script src="./AnimesCoverView.ts"></script>
