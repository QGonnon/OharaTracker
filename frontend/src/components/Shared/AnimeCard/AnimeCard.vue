<template>
  <Card class="manga-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer max-w-xs">
    <!-- Image -->
    <template #header>
      <div class="aspect-[3/4] overflow-hidden">
        <img
          :src="coverSrc"
          :alt="manga.title"
          class="w-full h-full object-cover hover:scale-110 transition-transform duration-300 bg-slate-100 dark:bg-slate-700"
        />
      </div>
    </template>

    <template #title>
      <h2 class="text-center text-lg font-semibold text-gray-800 dark:text-white px-2 truncate">
        {{ manga.title }}
      </h2>
    </template>

    <template #subtitle>
      <p class="text-center text-blue-500 dark:text-green-300 text-sm">{{ manga.site }}</p>
    </template>

    <template #content>
      <div class="p-4">
        <div class="flex-grow flex flex-col justify-center text-center px-3">
          <p class="text-gray-600 dark:text-gray-300 text-sm truncate">{{ $t('cards.last_episode') }} {{ manga.lastEpisode || manga.lastChapter || '-' }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3 justify-center mt-2 pb-3 px-4">
        <Button asChild v-slot="slotProps" class="flex-1 max-w-[130px]">
          <a :href="manga.chapterUrl" target="_blank" rel="noopener noreferrer" :class="slotProps.class">
            📺 {{ $t('cards.watch_episode') }}
          </a>
        </Button>

        <Button asChild v-slot="slotProps" class="flex-1 max-w-[130px]">
          <RouterLink :to="`/anime/${cleanTitle}`" :class="slotProps.class">
            📜 {{ $t('cards.watch_anime') }}
          </RouterLink>
        </Button>
      </div>
    </template>
  </Card>
</template>

<script src="./AnimeCard.ts"></script>
