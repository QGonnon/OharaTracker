import { defineComponent, ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { slugify } from '../../../utils.js';
import Menu from "../../Shared/Menu/Menu.js";
import { useMangaStore } from '../../../store/manga.module';
import type { Manga } from '../../../types/index';
import { useSeo } from '../../../seo/useSeo';
import { breadcrumbJsonLd, collectionJsonLd } from '../../../seo/jsonld';
import { DEFAULT_LOCALE, isLocale, absoluteUrl, homePath, pagePath, type Locale } from '../../../seo/config';
import { localeMedia } from '../../../seo/localePath';

export default defineComponent({
  name: 'Discovery',
  components: {
    Menu
  },
  setup() {
    const mangaStore = useMangaStore();
    const { t, locale } = useI18n();
    const featuredMangas = ref<Manga[]>([]);
    const featuredAnimes = ref<Manga[]>([]);
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

    const isAnime = (item: Manga): boolean => {
      return (item.type || 'Manga').toString().toLowerCase() === 'anime';
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

    const getCoverUrl = (item: Manga): string => mangaStore.getCoverUrl(item);

    const allItems = computed(() => [...featuredMangas.value, ...featuredAnimes.value]);

    const spotlightItem = computed(() => {
      const pool = allItems.value.filter(i => i.coverPath || i.coverUrl);
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
      try {
        // Catalogue allégé : cette page n'affiche que des vignettes, elle n'a
        // aucun besoin des chapitres de toutes les sources.
        const mangaList = await mangaStore.fetchLight();
        featuredMangas.value = mangaList.filter(m => !isAnime(m));
        featuredAnimes.value = mangaList.filter(m => isAnime(m));
      } catch (err) {
        console.error('Erreur fetching découverte:', err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchMangas);

    // ---------------------------------------------------------------------
    // SEO
    // ---------------------------------------------------------------------

    const currentLocale = computed<Locale>(() =>
      isLocale(locale.value) ? locale.value : DEFAULT_LOCALE
    );

    /** Lien canonique localisé vers une œuvre du catalogue. */
    const workPath = (item: Manga): string =>
      localeMedia(mangaStore.resolveMediaKind(null, item.type), slugify(item.title));

    useSeo({
      target: { type: 'page', key: 'discovery' },
      title: computed(() => t('seo.discovery.title')),
      description: computed(() => t('seo.discovery.description')),
      jsonLd: computed(() => [
        // `ItemList` : décrit la page comme un vrai catalogue et donne à Google
        // un chemin d'exploration vers chaque fiche, même sans exécuter le JS.
        collectionJsonLd({
          name: t('seo.discovery.title'),
          description: t('seo.discovery.description'),
          url: absoluteUrl(pagePath('discovery', currentLocale.value)),
          locale: currentLocale.value,
          items: allItems.value.slice(0, 100).map(item => ({
            name: item.title,
            url: workPath(item),
          })),
        }),
        breadcrumbJsonLd([
          { name: t('seo.breadcrumb.home'), path: homePath(currentLocale.value) },
          { name: t('seo.discovery.title'), path: pagePath('discovery', currentLocale.value) },
        ]),
      ]),
    });

    return {
      workPath,
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
      getCoverUrl,
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