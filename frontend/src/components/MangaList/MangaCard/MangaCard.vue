<template>
    <div class="manga-card">
        <h2>{{ manga.title }}</h2>
        <p class="chapter"><strong>Chapitre :</strong> {{ manga.lastChapter }}</p>
        <p>
        <a :href="manga.chapterUrl" target="_blank" class="link">📖 Lire le chapitre</a>
        </p>
        <p>
        <a :href="manga.mangaUrl" target="_blank" class="link">📜 Voir le manga</a>
        </p>
    </div>
</template>

<style scoped>
@import url('./MangaCard.css');
</style>

<script src="./MangaCard.ts">
</script>