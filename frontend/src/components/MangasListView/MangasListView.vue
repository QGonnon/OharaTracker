<template>
    <div class="mangas-list-container">
        <!-- État de chargement -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Chargement des mangas...</p>
        </div>
        
        <!-- État d'erreur -->
        <div v-else-if="error" class="error-state">
            <p class="error-message">❌ {{ error }}</p>
            <button @click="fetchMangas" class="retry-button">Réessayer</button>
        </div>
        
        <!-- Liste des mangas -->
        <div v-else-if="mangas.length === 0" class="empty-state">
            <p>Aucun manga trouvé dans votre bibliothèque.</p>
        </div>
        
        <div v-else>
            <div class="manga-item" v-for="manga in mangas" :key="manga.id">
                <div class="manga-info">
                    <div class="manga-title-section">
                        <span class="manga-title"><a :href="manga.mangaUrl" target="_blank">{{ manga.title }}</a></span>
                    </div>
                </div>
                
                <div class="manga-chapters">
                    <div class="chapter-info">
                        <span class="chapter-read"><a :href="manga.chapterUrl" target="_blank">Ch. {{ manga.lastChapter }}</a></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script src="./MangasListView.ts"></script>

<style>
    @import './MangasListView.css';
</style>