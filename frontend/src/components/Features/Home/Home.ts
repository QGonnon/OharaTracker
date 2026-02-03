import { defineComponent, ref, onMounted } from "vue";
import Menu from "../../Common/Menu/Menu.vue";
import MangaCard from "../../Shared/MangaCard/MangaCard.vue";

export default defineComponent({
  name: "Home",
  components: {
    Menu,
    MangaCard,
  },
  setup() {
    const featuredMangas = ref<any[]>([]);
    const featuredAnimes = ref<any[]>([]);
    const latestChapters = ref<any[]>([]);
    const loading = ref(true);

    const fetchMangas = async () => {
      const chapterUrl = `${import.meta.env.VITE_API_URL}/chapters`;
      try {
        const res = await fetch(chapterUrl);
        const chapters = (await res.json()) || [];

        // Séparer les animes et les mangas
        const animes: any[] = [];
        const mangas: any[] = [];

        chapters.forEach((ch: any) => {
          const item = {
            id: ch.chapterId,
            title: ch.title,
            author: ch.author,
            theme: ch.theme,
            status: ch.status,
            description: ch.description,
            coverPath: ch.coverPath,
            coverUrl: ch.coverUrl,
            lastChapter: ch.lastChapter,
            chapterUrl: ch.chapterUrl,
            mangaUrl: ch.mangaUrl,
            site: ch.site,
            type: ch.type,
          };

          const site = (ch.site || '').toString().toLowerCase();
          const type = (ch.type || '').toString().toUpperCase();
          const theme = (ch.theme || '').toString().toLowerCase();

          // Classer comme anime si: site === 'moviedb' OU type === 'ANIME' OU theme contient 'anime'
          if (site === 'moviedb' || type === 'ANIME' || theme.includes('anime')) {
            animes.push(item);
          } else {
            mangas.push(item);
          }
        });

        // Conserver derniers chapitres (tous)
        latestChapters.value = chapters.slice(0, 10);

        // Dédupliquér et construire listes de mangas et animes
        const mangaMap = new Map();
        mangas.forEach((m: any) => {
          const key = (m.title || "").toLowerCase().trim();
          if (!mangaMap.has(key)) mangaMap.set(key, m);
        });

        const animeMap = new Map();
        animes.forEach((a: any) => {
          const key = (a.title || "").toLowerCase().trim();
          if (!animeMap.has(key)) animeMap.set(key, a);
        });

        featuredMangas.value = Array.from(mangaMap.values()).slice(0, 6);
        featuredAnimes.value = Array.from(animeMap.values()).slice(0, 6);
      } catch (err) {
        console.error("Erreur fetching mangas:", err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchMangas);

    return { featuredMangas, featuredAnimes, latestChapters, loading };
  },
});
