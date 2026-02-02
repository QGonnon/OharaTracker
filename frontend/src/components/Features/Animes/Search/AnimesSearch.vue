<template>
  <Menu />
  <div class="search-page min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="container mx-auto px-4 max-w-7xl">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          <i class="pi pi-search mr-3"></i>Recherche d'Animes
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Trouvez vos animes préférés parmi notre collection
        </p>
      </div>

      <!-- Search Bar -->
      <div class="mb-8">
        <div class="flex gap-4">
          <span class="p-input-icon-left flex-1">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Rechercher un anime par titre, auteur ou genre..."
              class="w-full"
              @keyup.enter="performSearch"
            />
          </span>
          <Button
            label="Rechercher"
            icon="pi pi-search"
            @click="performSearch"
            :loading="isLoading"
            class="px-8"
          />
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            <i class="pi pi-filter mr-2"></i>Filtres
          </h2>
          <Button
            label="Réinitialiser"
            icon="pi pi-refresh"
            text
            @click="resetFilters"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Genre Filter -->
          <div class="flex flex-col">
            <label for="genre" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Genre
            </label>
            <MultiSelect
              id="genre"
              v-model="selectedGenres"
              :options="genres"
              placeholder="Sélectionner des genres"
              :maxSelectedLabels="2"
              class="w-full"
              display="chip"
            />
          </div>

          <!-- Status Filter -->
          <div class="flex flex-col">
            <label for="status" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Statut
            </label>
            <Select
              id="status"
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Tous les statuts"
              class="w-full"
            />
          </div>

          <!-- Sort By -->
          <div class="flex flex-col">
            <label for="sortBy" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Trier par
            </label>
            <Select
              id="sortBy"
              v-model="sortBy"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Popularité"
              class="w-full"
            />
          </div>

          <!-- Year Filter -->
          <div class="flex flex-col">
            <label for="year" class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Année
            </label>
            <InputNumber
              id="year"
              v-model="selectedYear"
              placeholder="Toutes les années"
              :useGrouping="false"
              :min="1950"
              :max="2025"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="flex items-center justify-between mb-6">
        <div class="text-gray-700 dark:text-gray-300">
          <span class="font-semibold">{{ totalResults }}</span> résultat(s) trouvé(s)
        </div>
        <div class="flex gap-2">
          <Button
            icon="pi pi-th-large"
            :outlined="viewMode !== 'grid'"
            @click="viewMode = 'grid'"
            title="Vue grille"
          />
          <Button
            icon="pi pi-list"
            :outlined="viewMode !== 'list'"
            @click="viewMode = 'list'"
            title="Vue liste"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <ProgressSpinner />
      </div>

      <!-- No Results -->
      <div v-else-if="!isLoading && searchResults.length === 0 && hasSearched" class="text-center py-20">
        <i class="pi pi-search text-6xl text-gray-400 mb-4"></i>
        <h3 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Aucun résultat trouvé
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          Essayez de modifier vos critères de recherche
        </p>
      </div>

      <!-- Results - Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div
          v-for="manga in visibleResults"
          :key="manga.id"
          class="manga-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
          @click="goToAnime(manga)"
        >
          <div class="aspect-[3/4] overflow-hidden">
            <img
              :src="getCoverUrl(manga)"
              :alt="manga.title"
              class="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {{ manga.title }}
            </h3>
            <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span class="flex items-center" v-if="manga.lastChapter || manga.lastEpisode">
                <i class="pi pi-book mr-1"></i>
                Ep. {{ manga.lastEpisode || manga.lastChapter }}
              </span>
              <Tag v-if="manga.status" :value="manga.status" :severity="getStatusSeverity(manga.status)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Results - List View -->
      <div v-else-if="viewMode === 'list'" class="space-y-4">
        <div
          v-for="manga in visibleResults"
          :key="manga.id"
          class="manga-card-list bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow duration-300 cursor-pointer flex gap-4"
          @click="goToAnime(manga)"
        >
          <div class="w-24 h-32 flex-shrink-0 rounded overflow-hidden">
            <img
              :src="getCoverUrl(manga)"
              :alt="manga.title"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {{ manga.title }}
              </h3>
              <p v-if="manga.description" class="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                {{ manga.description }}
              </p>
              <div class="flex flex-wrap gap-2 mb-2">
                <Tag v-if="manga.theme" :value="manga.theme" />
                <Tag v-if="manga.site" :value="manga.site" severity="secondary" />
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span v-if="manga.author" class="text-sm text-gray-600 dark:text-gray-400">
                <i class="pi pi-user mr-1"></i>{{ manga.author }}
              </span>
              <div class="flex items-center gap-4">
                <span v-if="manga.lastChapter || manga.lastEpisode" class="flex items-center text-sm">
                  <i class="pi pi-book mr-1"></i>
                  Ep. {{ manga.lastEpisode || manga.lastChapter }}
                </span>
                <Tag v-if="manga.status" :value="manga.status" :severity="getStatusSeverity(manga.status)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="searchResults.length > 0" class="mt-8 flex justify-center">
        <Paginator
          :rows="itemsPerPage"
          :totalRecords="totalResults"
          :rowsPerPageOptions="[12, 24, 48]"
          @page="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script src="./AnimesSearch.ts"></script>

<style scoped src="../../Search/Search.css"></style>
