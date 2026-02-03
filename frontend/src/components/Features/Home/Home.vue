<template>
  <Menu />

  <section class="home-hero container lg:py-20 py-12">
    <div class="hero-inner max-w-6xl mx-auto text-center">
      <h1 class="hero-title text-4xl font-extrabold mb-4">Ohara Tracker — Suivez vos séries préférées</h1>
      <p class="hero-sub text-lg mb-6">Découvrez les dernières sorties, retrouvez vos chapitres et gardez une trace de vos lectures.</p>
      <div class="hero-cta flex justify-center gap-4">
        <router-link to="/list" class="btn-primary px-6 py-3 rounded-md">Voir la bibliothèque</router-link>
        <router-link to="/search" class="btn-secondary px-6 py-3 rounded-md">Rechercher</router-link>
      </div>
    </div>
  </section>

  <section class="featured container py-10">
    <div class="max-w-6xl mx-auto">
      <h2 class="section-title text-2xl font-bold mb-4">À la une — Mangas</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <MangaCard v-for="m in featuredMangas" :key="m.id" :manga="m" />
      </div>
    </div>
  </section>

  <section class="featured container py-10">
    <div class="max-w-6xl mx-auto">
      <h2 class="section-title text-2xl font-bold mb-4">Dernières sorties — Anime</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <MangaCard v-for="a in featuredAnimes" :key="a.id" :manga="a" />
      </div>
    </div>
  </section>

  <section class="latest container py-10">
    <div class="max-w-6xl mx-auto">
      <h2 class="section-title text-2xl font-bold mb-4">Derniers chapitres</h2>
      <div v-if="loading">Chargement...</div>
      <ul v-else class="list space-y-3">
        <li v-for="c in latestChapters" :key="c.chapterId" class="flex justify-between items-center p-3 rounded-md" :class="{'bg-white/5': $root?.$el?.classList?.contains('dark-theme')}">
          <div>
            <router-link :to="`/manga/${c.mangaUrl}`" class="font-medium">{{ c.title }}</router-link>
            <div class="text-sm text-muted">{{ c.site }} — Chap. {{ c.lastChapter }}</div>
          </div>
          <div class="text-sm text-muted">{{ c.releaseDate || '' }}</div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script src="./Home.ts"></script>
