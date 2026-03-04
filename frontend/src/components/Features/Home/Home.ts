import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import Menu from "../../Common/Menu/Menu.vue";
import MangaCard from "../../Shared/MangaCard/MangaCard.vue";
import Carousel from "primevue/carousel";
import { slugify } from '../../../utils.js'

export default defineComponent({
  name: "Home",
  components: {
    Menu,
    MangaCard,
    Carousel,
  },
  setup() {
    const featuredMangas = ref<any[]>([]);
    const featuredAnimes = ref<any[]>([]);
    const latestChapters = ref<any[]>([]);
    const loading = ref(true);
    const currentPage = ref(0);
    const windowWidth = ref(window.innerWidth);

    const handleResize = () => { windowWidth.value = window.innerWidth; };
    onMounted(() => window.addEventListener('resize', handleResize));
    onUnmounted(() => window.removeEventListener('resize', handleResize));

    const currentNumVisible = computed(() => {
      const w = windowWidth.value;
      if (w <= 480) return 1;
      if (w <= 768) return 2;
      if (w <= 1024) return 3;
      if (w <= 1400) return 4;
      return 7;
    });

    const centerIndex = computed(() => {
      const numVisible = currentNumVisible.value;
      if (numVisible % 2 === 0) return -1;
      const len = featuredMangas.value.length;
      const half = Math.floor(numVisible / 2);
      if (len === 0) return half;
      return ((currentPage.value + half) % len + len) % len;
    });

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

        featuredMangas.value = Array.from(mangaMap.values()).slice(0, 15);
        featuredAnimes.value = Array.from(animeMap.values()).slice(0, 6);
      } catch (err) {
        console.error("Erreur fetching mangas:", err);
      } finally {
        loading.value = false;
      }
    };

    const responsiveOptions = [
      { breakpoint: "1400px", numVisible: 4, numScroll: 1 },
      { breakpoint: "1024px", numVisible: 3, numScroll: 1 },
      { breakpoint: "768px", numVisible: 2, numScroll: 1 },
      { breakpoint: "480px", numVisible: 1, numScroll: 1 },
    ];

    onMounted(fetchMangas);

    return { featuredMangas, featuredAnimes, latestChapters, loading, responsiveOptions, slugify, currentPage, centerIndex };
  },
});
