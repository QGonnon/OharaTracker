<template>
  <Menu />

  <div v-if="loading" class="text-center p-8 text-gray-500">
    Chargement du manga...
  </div>

  <div v-else-if="error" class="text-center text-red-500">
    {{ error }}
  </div>

  <div v-else-if="manga && manga.title" class="manga-container">
    <div class="column image-column">
      <img
        :src="`https://picsum.photos/seed/${manga.id}/400/568`"
        :alt="manga.title"
      />
    </div>

    <div class="column info-column">
      <h2>{{ manga.title }}</h2>
      <p><strong>Auteur :</strong> {{ manga.author || 'Inconnu' }}</p>
      <p><strong>Genre :</strong> {{ manga.theme || 'N/A' }}</p>
      <p><strong>Statut :</strong> {{ manga.status || 'Inconnu' }}</p>
      <p><strong>Synopsis :</strong> {{ manga.description || 'Aucune description disponible.' }}</p>

      <div class="mt-6">
        <a
          v-if="manga.chapterUrl"
          :href="manga.chapterUrl"
          target="_blank"
          class="text-blue-600 hover:underline font-medium"
        >
          📖 Lire le dernier chapitre ({{ manga.lastChapter }})
        </a>
      </div>
    </div>
  </div>
</template>

<script src="./MangaInfo.ts"></script>
<style scoped>
.manga-container {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.column {
  flex: 1;
}

.image-column {
  max-width: 400px;
}

img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-column h2 {
  margin-bottom: 0.5rem;
}

.info-column p {
  line-height: 1.6;
}
</style>
