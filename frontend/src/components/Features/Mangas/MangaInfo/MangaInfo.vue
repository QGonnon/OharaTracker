<template>
  <Menu />

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
      <p class="text-lg text-surface-500">Chargement du manga...</p>
    </div>

    <!-- Error State -->
    <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- Manga Content -->
    <div v-else-if="manga && manga.title" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Image Column -->
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
              <Tag v-if="manga.theme" :value="manga.theme" />
              <Chip v-if="manga.site" :label="manga.site" icon="pi pi-globe" />
            </div>
          </template>
        </Card>

        <!-- Details Card -->
        <Card>
          <template #title>
            <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
              Informations
            </h2>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <i class="pi pi-user text-primary mt-1"></i>
                <div>
                  <p class="text-sm text-surface-500 dark:text-surface-400">Auteur</p>
                  <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                    {{ manga.author || 'Inconnu' }}
                  </p>
                </div>
              </div>

              <Divider />

              <div class="flex items-start gap-3">
                <i class="pi pi-bookmark text-primary mt-1"></i>
                <div>
                  <p class="text-sm text-surface-500 dark:text-surface-400">Dernier chapitre</p>
                  <p class="text-base font-medium text-surface-900 dark:text-surface-0">
                    Chapitre {{ manga.lastChapter }}
                  </p>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Synopsis Card -->
        <Card>
          <template #title>
            <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-100">
              Synopsis
            </h2>
          </template>
          <template #content>
            <p class="text-surface-700 dark:text-surface-300 leading-relaxed">
              {{ manga.description || 'Aucune description disponible.' }}
            </p>
          </template>
        </Card>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <!-- <Message v-if="addSuccess || isInLibrary" severity="success" :closable="false" icon="pi pi-check">
            {{ addSuccess ? 'Manga ajouté à votre bibliothèque.' : 'Déjà dans votre bibliothèque.' }}
          </Message> -->
          <Message v-if="addError && !isInLibrary" severity="error" :closable="false">
            {{ addError }}
          </Message>

          <div class="flex flex-col sm:flex-row gap-3">
          <Button
            v-if="manga.chapterUrl"
            :label="`Lire le chapitre ${manga.lastChapter}`"
            icon="pi pi-book"
            iconPos="left"
            severity="primary"
            size="large"
            class="w-full sm:w-auto"
            @click="openChapter"
          />

          <Button
            v-if="isLoggedIn"
            :label="isInLibrary ? '' : 'Ajouter à ma bibliothèque'"
            :icon="isInLibrary ? '' : 'pi pi-bookmark'"
            iconPos="left"
            severity="secondary"
            size="large"
            class="w-full sm:w-auto"
            outlined
            :loading="adding"
            :disabled="addSuccess || isInLibrary"
            @click="addToLibrary"
          />
          <Button
            v-if="isLoggedIn && isInLibrary"
            label="Éditer"
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
  
  <!-- Edit Dialog (shared) -->
  <EditLibraryDialog v-model:visible="editDialog" :manga="manga" @updated="onUpdated" />
</template>

<script src="./MangaInfo.ts"></script>
