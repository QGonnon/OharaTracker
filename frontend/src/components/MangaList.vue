<template>
    <div class="container">
      <h1>Derniers Chapitres MangaDex</h1>
      <div v-if="loading">Chargement...</div>
      <div v-else>
        <div v-for="manga in mangas" :key="manga.id" class="manga-card">
          <h2>{{ manga.title }}</h2>
          <p class="chapter"><strong>Chapitre :</strong> {{ manga.lastChapter }}</p>
          <p>
            <a :href="manga.chapterUrl" target="_blank" class="link">📖 Lire le chapitre</a>
          </p>
          <p>
            <a :href="manga.mangaUrl" target="_blank" class="link">📜 Voir le manga</a>
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, onMounted, ref } from "vue";
  import axios from "axios";
  
  interface Manga {
    id: string;
    title: string;
    lastChapter: string;
    chapterUrl: string;
    mangaUrl: string;
  }
  
  export default defineComponent({
    setup() {
      const mangas = ref<Manga[]>([]);
      const loading = ref<boolean>(true);
  
      const getMangaTitle = async (mangaId: string): Promise<string> => {
        try {
          const response = await axios.get(`https://api.mangadex.org/manga/${mangaId}`);
          const attributes = response.data.data.attributes;
          return attributes.title.fr || attributes.title.en || "Titre inconnu";
        } catch (error) {
          console.error(`❌ Erreur lors de la récupération du titre du manga ${mangaId}`, error);
          return "Titre inconnu";
        }
      };
  
      const fetchMangas = async () => {
        const baseUrl = "https://api.mangadex.org/";
        const chapterUrl = `${baseUrl}chapter?limit=10&translatedLanguage[]=fr&order[createdAt]=desc`;
  
        try {
          const response = await axios.get(chapterUrl);
          const chapters = response.data.data || [];
  
          const mangaList: Manga[] = await Promise.all(
            chapters.map(async (chapter: any) => {
              const lastChapter = chapter.attributes.chapter || "N/A";
              const chapterId = chapter.id;
              const chapterUrl = `https://mangadex.org/chapter/${chapterId}`;
              const mangaId = chapter.relationships.find((rel: any) => rel.type === "manga")?.id;
  
              if (!mangaId) return null;
  
              const mangaUrl = `https://mangadex.org/title/${mangaId}`;
              const title = await getMangaTitle(mangaId);
  
              return { id: chapterId, title, lastChapter, chapterUrl, mangaUrl };
            })
          );
  
          mangas.value = mangaList.filter((manga) => manga !== null) as Manga[];
          loading.value = false;
        } catch (error) {
          console.error("❌ Erreur lors de la récupération des mangas :", error);
          loading.value = false;
        }
      };
  
      onMounted(fetchMangas);
  
      return { mangas, loading };
    },
  });
  </script>
  
  <style scoped>
  .container {
    max-width: 900px;
    margin: auto;
    text-align: center;
    padding: 20px;
  }
  
  h1 {
    font-size: 2.2rem;
    color: #222;
    font-weight: bold;
    text-transform: uppercase;
    text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }
  
  .manga-card {
    border: 1px solid #ddd;
    background-color: #fff;
    padding: 20px;
    margin: 15px 0;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .manga-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
  
  h2 {
    font-size: 1.5rem;
    color: #333;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .chapter {
    font-size: 1rem;
    color: #555;
  }
  
  .link {
    display: inline-block;
    font-size: 1rem;
    color: #007bff;
    text-decoration: none;
    transition: color 0.3s;
  }
  
  .link:hover {
    color: #0056b3;
    text-decoration: underline;
  }
  </style>
  