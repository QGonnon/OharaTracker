<template>
  <Menu />
  <div id="MangaList">
    <h1>Derniers Chapitres</h1>
    <div class="container">
      <div v-if="loading">Chargement...</div>
      <div v-else v-for="manga in mangas" :key="manga.id">
          <MangaCard :manga="manga" />
      </div>
    </div>
  </div>
</template>
   
  <style scoped>
  @import url('./MangasCoverView.css');
  </style>

  <script src="./MangasCoverView.ts">
  </script>
  