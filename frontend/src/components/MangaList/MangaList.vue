<template>
    <div id="app">
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
  @import url('./MangaList.css');
  </style>

  <script src="./MangaList.ts">
  </script>
  