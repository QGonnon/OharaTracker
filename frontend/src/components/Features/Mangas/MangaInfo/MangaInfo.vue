<template>
  <Menu />

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
      <p class="text-lg text-surface-500">{{ $t('manga.loading') }}</p>
    </div>

    <!-- Error State -->
    <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- Content -->
    <div v-else-if="manga && manga.title" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cover -->
      <div class="lg:col-span-1">
        <Card class="overflow-hidden">
          <template #content>
            <img
              :src="coverSrc"
              :alt="manga.title"
              class="w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
          </template>
        </Card>
      </div>

      <!-- Info Column -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Title Card -->
        <Card>
          <template #title>
            <h1 class="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-0">
              {{ manga.title }}
            </h1>
          </template>
          <template #content>
            <div class="flex flex-wrap gap-2 mt-2">
              <Tag v-if="manga.status" :value="manga.status" severity="info" />
              <!-- Tags : affichage un par un -->
              <Tag
                v-for="tag in parseTags(manga.theme)"
                :key="tag"
                :value="tag"
              />
              <!-- Sources -->
              <Chip v-if="manga.site" :label="manga.site" icon="pi pi-globe" />
            </div>
          </template>
        </Card>

        <!-- Details Card -->
        <Card>
          <template #title>
            <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
              {{ $t('manga.information') }}
            </h2>
          </template>
          <template #content>
            <div class="space-y-4">

              <!-- Auteur (lecture uniquement) -->
              <div v-if="isLecture" class="flex items-start gap-3">
                <i class="pi pi-user text-primary mt-1"></i>
                <div>
                  <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.author') }}</p>
                  <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                    {{ manga.author || $t('manga.unknown') }}
                  </p>
                </div>
              </div>

              <!-- Studio (série et film) -->
              <div v-if="isSerie || isFilm" class="flex items-start gap-3">
                <i class="pi pi-building text-primary mt-1"></i>
                <div>
                  <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.studio') }}</p>
                  <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                    {{ manga.studio || manga.artist || $t('manga.unknown') }}
                  </p>
                </div>
              </div>

              <Divider />

              <!-- Nb chapitres (lecture) -->
              <div v-if="isLecture" class="flex items-start gap-3">
                <i class="pi pi-book text-primary mt-1"></i>
                <div>
                  <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.last_chapter') }}</p>
                  <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                    {{ manga.lastChapter || $t('manga.unknown') }}
                  </p>
                </div>
              </div>

              <!-- Nb épisodes + saisons (série) -->
              <template v-if="isSerie">
                <div class="flex items-start gap-3">
                  <i class="pi pi-video text-primary mt-1"></i>
                  <div>
                    <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.total_episodes') }}</p>
                    <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                      {{ manga.totalEpisodes ?? manga.lastChapter ?? $t('manga.unknown') }}
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <i class="pi pi-list text-primary mt-1"></i>
                  <div>
                    <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.total_seasons') }}</p>
                    <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                      {{ manga.totalSeasons ?? $t('manga.unknown') }}
                    </p>
                  </div>
                </div>
              </template>

              <Divider />

              <!-- Date de parution (tous les types) -->
              <div class="flex items-start gap-3">
                <i class="pi pi-calendar text-primary mt-1"></i>
                <div>
                  <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.release_date') }}</p>
                  <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                    {{ manga.releaseDate || $t('manga.unknown') }}
                  </p>
                </div>
              </div>

              <Divider />

              <!-- Scores (tous les types) -->
              <div class="flex gap-6">
                <div class="flex items-start gap-3">
                  <i class="pi pi-star text-primary mt-1"></i>
                  <div>
                    <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.average_score') }}</p>
                    <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                      {{ manga.averageScore ?? $t('manga.unknown') }}
                    </p>
                  </div>
                </div>
                <div v-if="isLoggedIn && isInLibrary" class="flex items-start gap-3">
                  <i class="pi pi-star-fill text-warning mt-1"></i>
                  <div>
                    <p class="text-sm text-surface-500 dark:text-surface-400">{{ $t('manga.user_score') }}</p>
                    <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                      {{ userScore ?? $t('manga.unknown') }}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </template>
        </Card>

        <!-- Synopsis Card -->
        <Card>
          <template #title>
            <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
              {{ $t('manga.synopsis') }}
            </h2>
          </template>
          <template #content>
            <p class="text-surface-700 dark:text-surface-300 leading-relaxed">
              {{ manga.description || $t('manga.no_description') }}
            </p>
          </template>
        </Card>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <Message v-if="addError && !isInLibrary" severity="error" :closable="false">
            {{ addError }}
          </Message>
          <div class="flex flex-col sm:flex-row gap-3">
            <Button
              v-if="manga.chapterUrl"
              :label="isLecture
                ? $t('manga.read_chapter', { n: manga.lastChapter })
                : isSerie
                  ? $t('manga.watch_episode', { ep: manga.lastChapter })
                  : $t('manga.watch_film')"
              :icon="isLecture ? 'pi pi-book' : 'pi pi-play'"
              iconPos="left"
              severity="primary"
              size="large"
              class="w-full sm:w-auto"
              @click="openChapter"
            />
            <Button
              v-if="isLoggedIn && !isInLibrary"
              :label="$t('manga.add_to_library')"
              icon="pi pi-bookmark"
              iconPos="left"
              severity="secondary"
              size="large"
              class="w-full sm:w-auto"
              outlined
              :loading="adding"
              @click="addToLibrary"
            />
            <Button
              v-if="isLoggedIn && isInLibrary"
              :label="$t('manga.edit')"
              icon="pi pi-pencil"
              iconPos="left"
              severity="warning"
              size="large"
              class="w-full sm:w-auto"
              @click="openEdit"
            />
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Oeuvres similaires -->
  <div v-if="similarWorks.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <div class="flex items-center gap-3 mb-6">
      <span class="w-1 h-6 rounded bg-gradient-to-b from-violet-500 to-pink-400"></span>
      <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ $t('manga.similar') }}</h2>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <RouterLink
        v-for="item in similarWorks"
        :key="item.title"
        :to="similarWorkPath(item)"
        class="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 group block"
      >
        <img
          :src="getItemCover(item)"
          :alt="item.title"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-3 transition-opacity duration-200">
          <p class="text-white font-semibold text-sm truncate mb-1">{{ item.title }}</p>
        </div>
      </RouterLink>
    </div>
  </div>

  <!-- Edit Dialogs -->
  <EditAnimeDialog v-if="isSerie" v-model:visible="editDialog" :anime="manga" @updated="onUpdated" />
  <EditLibraryDialog v-else v-model:visible="editDialog" :manga="manga" @updated="onUpdated" />
</template>

<script src="./MangaInfo.ts"></script>