<template>
  <Card class="flex flex-col justify-between w-80 h-[450px] overflow-hidden rounded-2xl shadow-lg bg-white">
    <!-- Image -->
    <template #header>
      <img
        :src="randomImage"
        alt="Manga cover"
        class="w-full h-48 object-cover"
      />
    </template>

    <!-- Titre + sous-titre -->
    <template #title>
      <h2 class="text-center text-lg font-semibold text-gray-800 px-2 truncate">
        {{ manga.title }}
      </h2>
    </template>

    <template #subtitle>
      <p class="text-center text-blue-500 text-sm">{{ manga.site }}</p>
    </template>

    <!-- Contenu -->
    <template #content>
      <div class="flex-grow flex flex-col justify-center text-center px-3">
        <p class="text-gray-600 text-sm">Dernier chapitre : {{ manga.lastChapter }}</p>
      </div>
    </template>

    <!-- Footer avec boutons -->
    <template #footer>
      <div class="flex gap-3 justify-center mt-2 pb-3">
        <Button asChild v-slot="slotProps" class="flex-1 max-w-[130px]">
          <RouterLink :href="manga.chapterUrl" target="_blank" :class="slotProps.class">
            📖 Lire le chapitre
          </RouterLink>
        </Button>

        <Button asChild v-slot="slotProps" class="flex-1 max-w-[130px]">
          <RouterLink :to="`/manga/${cleanTitle}`" :class="slotProps.class">
            📜 Voir le manga
          </RouterLink>
        </Button>
      </div>
    </template>
  </Card>
</template>

<script src="./MangaCard.ts"></script>
