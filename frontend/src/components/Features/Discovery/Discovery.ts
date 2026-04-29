import { defineComponent, ref, computed, onMounted } from "vue";
import { slugify } from '../../../utils.js';
import Menu from "../../Shared/Menu/Menu.js";

export default defineComponent({
  name: 'Discovery',
  components: {
    Menu
  },
  setup() {
    const featuredMangas = ref<any[]>([]);
    const featuredAnimes = ref<any[]>([]);
    const loading = ref(true);
    const activeType = ref<'all' | 'manga' | 'anime'>('all');
    const activeGenre = ref('');
    const sortBy = ref<'latest' | 'alpha'>('latest');
    const spotlightIndex = ref(0);

    const types = [
      { label: 'Tout', value: 'all' },
      { label: 'Manga', value: 'manga' },
      { label: 'Anime', value: 'anime' },
    ];

    const isAnime = (item: any): boolean => {
      const site = (item.site || '').toLowerCase();
      const type = (item.type || '').toUpperCase();
      const theme = (item.theme || '').toLowerCase();
      return site === 'moviedb' || type === 'ANIME' || theme.includes('anime');
    };

    const getThemeTags = (item: any): string[] => {
      if (!item.theme) return [];
      return item.theme
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t && t.toLowerCase() !== 'anime')
        .slice(0, 3);
    };

    const truncate = (text: string, max: number): string => {
      if (!text) return '';
      return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
    };

    const allItems = computed(() => [...featuredMangas.value, ...featuredAnimes.value]);

    const spotlightItem = computed(() => {
      const pool = allItems.value.filter(i => i.coverUrl);
      if (!pool.length) return null;
      return pool[spotlightIndex.value % pool.length];
    });

    const trending = computed(() => allItems.value.slice(0, 8));

    const filteredItems = computed(() => {
      let items = allItems.value;

      if (activeType.value === 'manga') items = featuredMangas.value;
      else if (activeType.value === 'anime') items = featuredAnimes.value;

      if (activeGenre.value) {
        items = items.filter(i =>
          (i.theme || '').toLowerCase().includes(activeGenre.value.toLowerCase())
        );
      }

      if (sortBy.value === 'alpha') {
        return [...items].sort((a, b) => a.title.localeCompare(b.title));
      }
      return items;
    });

    const sectionTitle = computed(() => {
      if (activeType.value === 'manga') return 'Mangas';
      if (activeType.value === 'anime') return 'Animés';
      return 'discovery.catalog';
    });

    const setType = (val: string) => {
      activeType.value = val as 'all' | 'manga' | 'anime';
      activeGenre.value = '';
    };

    const toggleGenre = (genre: string) => {
      activeGenre.value = activeGenre.value === genre ? '' : genre;
    };

    const resetFilters = () => {
      activeType.value = 'all';
      activeGenre.value = '';
      sortBy.value = 'latest';
    };

    const fetchMangas = async () => {
      const chapterUrl = `${import.meta.env.VITE_API_URL}/chapters`;
      try {
        const res = await fetch(chapterUrl);
        const chapters = (await res.json()) || [];

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
            lastEpisode: ch.lastEpisode,
            chapterUrl: ch.chapterUrl,
            mangaUrl: ch.mangaUrl,
            site: ch.site,
            type: ch.type,
          };

          const site = (ch.site || '').toLowerCase();
          const type = (ch.type || '').toUpperCase();
          const theme = (ch.theme || '').toLowerCase();

          if (site === 'moviedb' || type === 'ANIME' || theme.includes('anime')) {
            animes.push(item);
          } else {
            mangas.push(item);
          }
        });

        const mangaMap = new Map<string, any>();
        mangas.forEach((m: any) => {
          const key = (m.title || '').toLowerCase().trim();
          if (!mangaMap.has(key)) mangaMap.set(key, m);
        });

        const animeMap = new Map<string, any>();
        animes.forEach((a: any) => {
          const key = (a.title || '').toLowerCase().trim();
          if (!animeMap.has(key)) animeMap.set(key, a);
        });

        featuredMangas.value = Array.from(mangaMap.values());
        featuredAnimes.value = Array.from(animeMap.values());
      } catch (err) {
        console.error('Erreur fetching découverte:', err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchMangas);

    return {
      featuredMangas,
      featuredAnimes,
      loading,
      activeType,
      activeGenre,
      sortBy,
      types,
      isAnime,
      getThemeTags,
      truncate,
      spotlightItem,
      trending,
      filteredItems,
      sectionTitle,
      setType,
      toggleGenre,
      resetFilters,
      slugify,
    };
  }
});
