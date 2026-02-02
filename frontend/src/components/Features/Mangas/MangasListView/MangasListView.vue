<template>
    <Menu />
    
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-2">Ma Bibliothèque</h1>
                <p class="text-slate-600 dark:text-slate-400">{{ filteredMangas.length }} manga{{ filteredMangas.length !== 1 ? 's' : '' }}</p>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-20">
                <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-4"></i>
                <p class="text-lg text-slate-600 dark:text-slate-400">Chargement des mangas...</p>
            </div>

            <!-- Error State -->
            <Message v-else-if="error" severity="error" :closable="true" class="mb-6">
                <template #container="{ closeCallback }">
                    <div class="flex items-center gap-4">
                        <i class="pi pi-exclamation-triangle"></i>
                        <span>{{ error }}</span>
                        <Button icon="pi pi-times" @click="closeCallback()" text rounded/>
                    </div>
                </template>
            </Message>

            <!-- Empty State -->
            <Card v-else-if="filteredMangas.length === 0" class="text-center py-12">
                <template #content>
                    <i class="pi pi-inbox text-5xl text-slate-300 dark:text-slate-600 mb-4"></i>
                    <p class="text-lg text-slate-600 dark:text-slate-400">
                        {{ searchQuery ? 'Aucun manga ne correspond à votre recherche.' : 'Aucun manga trouvé dans votre bibliothèque.' }}
                    </p>
                    <Button 
                        v-if="!searchQuery"
                        @click="fetchMangas" 
                        label="Recharger" 
                        icon="pi pi-refresh" 
                        class="mt-6"
                    />
                </template>
            </Card>

            <!-- Content -->
            <div v-else>
                <!-- Search Bar and View Toggle -->
                <Card class="mb-6">
                    <template #content>
                        <div class="flex gap-4 items-center">
                            <IconField class="flex-1">
                                <InputIcon class="pi pi-search"></InputIcon>
                                <InputText 
                                    v-model="searchQuery" 
                                    placeholder="Rechercher par titre, auteur ou site..."
                                    class="w-full"
                                />
                            </IconField>
                            <div class="flex gap-2">
                                <Button 
                                    @click="viewMode = 'list'"
                                    :severity="viewMode === 'list' ? 'info' : 'secondary'"
                                    icon="pi pi-list"
                                    rounded
                                    text
                                    v-tooltip="'Vue en liste'"
                                />
                                <Button 
                                    @click="viewMode = 'grid'"
                                    :severity="viewMode === 'grid' ? 'info' : 'secondary'"
                                    icon="pi pi-th-large"
                                    rounded
                                    text
                                    v-tooltip="'Vue en grille'"
                                />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- List View -->
                <Card v-if="viewMode === 'list'">
                    <template #content>
                        <DataTable 
                            :value="filteredMangas"
                            stripedRows
                            paginator
                            :rows="10"
                            :rowsPerPageOptions="[5, 10, 20, 50]"
                            responsiveLayout="scroll"
                            class="p-datatable-sm"
                        >
                            <!-- Title Column -->
                            <Column field="title" header="Titre" sortable style="min-width: 200px;">
                                <template #body="{ data }">
                                    <a 
                                        :href="data.mangaUrl" 
                                        target="_blank"
                                        class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                    >
                                        {{ data.title }}
                                    </a>
                                </template>
                            </Column>

                            <!-- Author Column -->
                            <Column field="author" header="Auteur" sortable style="min-width: 150px;">
                                <template #body="{ data }">
                                    <span class="text-slate-700 dark:text-slate-300">
                                        {{ data.author || '-' }}
                                    </span>
                                </template>
                            </Column>

                            <!-- Status Column -->
                            <Column field="status" header="Statut" sortable style="min-width: 120px;">
                                <template #body="{ data }">
                                    <Tag 
                                        :value="data.readingStatus || data.status || 'Inconnu'"
                                        :severity="(data.readingStatus ? 'info' : (data.status === 'Ongoing' ? 'success' : data.status === 'Completed' ? 'info' : 'warning'))"
                                    />
                                </template>
                            </Column>

                            <!-- Last Chapter Column -->
                            <Column field="lastChapter" header="Dernier Chapitre" sortable style="min-width: 150px;">
                                <template #body="{ data }">
                                    <Button 
                                        :label="`Ch. ${data.userLastChapter || data.lastChapter || '-'}`"
                                        @click="openChapter(data.chapterUrl)"
                                        icon="pi pi-arrow-up-right"
                                        iconPos="right"
                                        text
                                        class="text-indigo-600 dark:text-indigo-400"
                                    />
                                </template>
                            </Column>

                            <!-- Actions Column -->
                            <Column header="Actions" style="min-width: 120px;">
                                <template #body="{ data }">
                                    <Button 
                                        label="Éditer"
                                        icon="pi pi-pencil"
                                        class="p-button-text p-button-plain"
                                        @click.prevent="openEdit(data)"
                                    />
                                </template>
                            </Column>

                            <!-- Site Column -->
                            <Column field="site" header="Source" sortable style="min-width: 120px;">
                                <template #body="{ data }">
                                    <Tag 
                                        :value="data.site"
                                        severity="secondary"
                                    />
                                </template>
                            </Column>

                            <!-- Theme Column -->
                            <Column field="theme" header="Genre" style="min-width: 150px;">
                                <template #body="{ data }">
                                    <div class="flex flex-wrap gap-1">
                                        <Tag 
                                            v-for="tag in (data.theme ? data.theme.split(', ') : []).slice(0, 2)"
                                            :key="tag"
                                            :value="tag"
                                            severity="info"
                                            class="text-xs"
                                        />
                                        <Tag 
                                            v-if="data.theme && data.theme.split(', ').length > 2"
                                            :value="`+${data.theme.split(', ').length - 2}`"
                                            severity="info"
                                            class="text-xs"
                                        />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>

                <!-- Grid View -->
                <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <Card v-for="manga in filteredMangas" :key="manga.id" class="flex flex-col">
                        <template #content>
                            <div class="flex flex-col h-full">
                                <!-- Cover Image -->
                                <div class="relative mb-4 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700 h-48">
                                    <img 
                                        v-if="getCoverUrl(manga)"
                                        :src="getCoverUrl(manga)" 
                                        :alt="manga.title"
                                        class="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                    />
                                    <div v-else class="w-full h-full flex items-center justify-center">
                                        <i class="pi pi-image text-4xl text-slate-400"></i>
                                    </div>
                                </div>

                                <!-- Manga Info -->
                                <h3 class="font-bold text-sm mb-2 line-clamp-2">{{ manga.title }}</h3>
                                
                                <!-- Status Badge -->
                                <div class="mb-3">
                                    <Tag 
                                        :value="manga.readingStatus || manga.status || 'Inconnu'"
                                        :severity="(manga.readingStatus ? 'info' : (manga.status === 'Ongoing' ? 'success' : manga.status === 'Completed' ? 'info' : 'warning'))"
                                        class="text-xs"
                                    />
                                </div>

                                <!-- Chapter and Source -->
                                <div class="text-xs text-slate-600 dark:text-slate-400 mb-3 space-y-1">
                                    <p><strong>Ch.</strong> {{ manga.userLastChapter || manga.lastChapter || '-' }}</p>
                                    <p><strong>Source:</strong> {{ manga.site }}</p>
                                </div>

                                <!-- Action Buttons -->
                                <div class="mt-auto flex gap-2">
                                    <Button 
                                        @click="openChapter(manga.chapterUrl)"
                                        icon="pi pi-arrow-up-right"
                                        text
                                        rounded
                                        class="flex-1 text-indigo-600 dark:text-indigo-400"
                                        v-tooltip="'Ouvrir le chapitre'"
                                    />
                                    <Button 
                                        @click="openEdit(manga)"
                                        icon="pi pi-pencil"
                                        text
                                        rounded
                                        class="text-slate-600 dark:text-slate-400"
                                        v-tooltip="'Éditer'"
                                    />
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
                </div>
        </div>

    <!-- Edit Dialog (shared) -->
    <EditLibraryDialog v-model:visible="editDialog" :manga="editingManga" @updated="onDialogUpdated" />

    </div>
</template>

<script src="./MangasListView.ts"></script>
