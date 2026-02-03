import { defineComponent } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import Tag from "primevue/tag";
import ProgressSpinner from "primevue/progressspinner";
import Paginator from "primevue/paginator";
import Menu from "../../../Common/Menu/Menu.vue";
import type { Manga } from "../../../../types/index";
import { slugify } from "../../../../utils";

interface SortOption {
  label: string;
  value: string;
}

export default defineComponent({
  name: "AnimesSearch",
  components: {
    Menu,
    InputText,
    Button,
    MultiSelect,
    Select,
    InputNumber,
    Tag,
    ProgressSpinner,
    Paginator,
  },
  data() {
    return {
      searchQuery: "",
      searchResults: [] as Manga[],
      allMangas: [] as Manga[],
      isLoading: false,
      hasSearched: false,
      viewMode: "grid" as "grid" | "list",
      searchTimeout: null as ReturnType<typeof setTimeout> | null,

      selectedGenres: [] as string[],
      selectedStatus: null as string | null,
      selectedYear: null as number | null,
      sortBy: "popularity" as string,

      genres: [] as string[],

      statusOptions: [
        "En cours",
        "Terminé",
        "En pause",
        "Abandonné",
      ] as string[],

      sortOptions: [
        { label: "Popularité", value: "popularity" },
        { label: "Note", value: "rating" },
        { label: "Titre (A-Z)", value: "title_asc" },
        { label: "Titre (Z-A)", value: "title_desc" },
        { label: "Plus récent", value: "newest" },
        { label: "Plus ancien", value: "oldest" },
      ] as SortOption[],

      itemsPerPage: 12,
      totalResults: 0,
      currentPage: 0,
    };
  },
  mounted() {
    this.loadMangas();

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    if (query) {
      this.searchQuery = query;
    }
    this.performSearch();
  },
  watch: {
    searchQuery() {
      this.isLoading = true;
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.searchTimeout = setTimeout(() => {
        this.performSearch();
      }, 1000);
    },
    selectedGenres() {
      this.performSearch();
    },
    selectedStatus() {
      this.performSearch();
    },
    selectedYear() {
      this.performSearch();
    },
    sortBy() {
      this.performSearch();
    },
  },
  computed: {
    visibleResults(): Manga[] {
      const start = this.currentPage * this.itemsPerPage;
      return this.searchResults.slice(start, start + this.itemsPerPage);
    },
  },
  methods: {
    async loadMangas() {
      try {
        const chapterUrl = `${import.meta.env.VITE_API_URL}/chapters`;
        const response = await fetch(chapterUrl);
        const chapters = await response.json() || [];

        // Keep only anime entries (MovieDB source or type ANIME)
        const animeOnly = chapters.filter((c: any) => {
          if (!c) return false;
          const site = (c.site || "").toString().toLowerCase();
          const type = (c.type || "").toString().toUpperCase();
          return site === 'moviedb' || type === 'ANIME' || (c.theme && c.theme.toLowerCase().includes('anime'));
        });

        const allMangasWithDuplicates = animeOnly.map((chapter: any) => ({
          id: chapter.chapterId || chapter.id,
          title: chapter.title || chapter.name,
          author: chapter.author,
          theme: chapter.theme,
          status: chapter.status,
          description: chapter.description,
          coverPath: chapter.coverPath,
          coverUrl: chapter.coverUrl,
          lastChapter: chapter.lastChapter || chapter.chapter,
          lastEpisode: (chapter.lastEpisode !== undefined) ? chapter.lastEpisode : chapter.lastChapter,
          chapterUrl: chapter.chapterUrl || chapter.url,
          mangaUrl: chapter.mangaUrl,
          site: chapter.site,
        }));

        const mangaMap = new Map<string, Manga>();
        allMangasWithDuplicates.forEach((manga: Manga) => {
          const normalizedTitle = manga.title?.toLowerCase().trim();
          if (normalizedTitle && !mangaMap.has(normalizedTitle)) {
            mangaMap.set(normalizedTitle, manga);
          }
        });

        this.allMangas = Array.from(mangaMap.values());
        this.extractGenres();
      } catch (error) {
        console.error("❌ Erreur lors du chargement des animes :", error);
      }
    },

    extractGenres() {
      const genresSet = new Set<string>();
      this.allMangas.forEach((manga) => {
        if (manga.theme) {
          const themeGenres = manga.theme
            .split(/[,;|]+/)
            .map((g: string) => g.trim())
            .filter((g: string) => g.length > 0);
          themeGenres.forEach((genre: string) => genresSet.add(genre));
        }
      });
      this.genres = Array.from(genresSet).sort((a, b) => a.localeCompare(b));
    },

    async performSearch() {
      this.isLoading = true;
      this.hasSearched = true;
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        let results = [...this.allMangas];
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          results = results.filter((manga) =>
            (manga.title || "").toLowerCase().includes(query) ||
            (manga.author || "").toLowerCase().includes(query) ||
            (manga.description || "").toLowerCase().includes(query)
          );
        }

        if (this.selectedGenres.length > 0) {
          results = results.filter((manga) =>
            this.selectedGenres.some((genre) => manga.theme?.toLowerCase().includes(genre.toLowerCase()))
          );
        }

        if (this.selectedStatus) {
          results = results.filter((manga) => manga.status?.toLowerCase() === this.selectedStatus?.toLowerCase());
        }

        results = this.sortResults(results);

        this.searchResults = results;
        this.totalResults = results.length;
        this.currentPage = 0;

        if (this.searchQuery) {
          const url = new URL(window.location.href);
          url.searchParams.set("q", this.searchQuery);
          window.history.pushState({}, "", url);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
      } finally {
        this.isLoading = false;
      }
    },

    resetFilters() {
      this.searchQuery = "";
      this.selectedGenres = [];
      this.selectedStatus = null;
      this.selectedYear = null;
      this.sortBy = "popularity";
      this.searchResults = [];
      this.hasSearched = false;
      this.totalResults = 0;
    },

    goToAnime(manga: Manga) {
      const cleanTitle = slugify(manga.title || "");
      this.$router.push(`/anime/${cleanTitle}`);
    },

    getCoverUrl(manga: Manga): string {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      if (manga.coverPath) return `${apiBase}/cdn/${manga.coverPath}`;
      if (manga.coverUrl) return manga.coverUrl;
      return `https://picsum.photos/seed/${manga.id}/400/600`;
    },

    getStatusSeverity(status?: string): "success" | "info" | "warn" | "danger" | undefined {
      switch (status) {
        case "En cours":
          return "success";
        case "Terminé":
          return "info";
        case "En pause":
          return "warn";
        case "Abandonné":
          return "danger";
        default:
          return undefined;
      }
    },

    onPageChange(event: { page: number; rows: number }) {
      this.currentPage = event.page;
      this.itemsPerPage = event.rows;
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    sortResults(results: Manga[]): Manga[] {
      switch (this.sortBy) {
        case "title_asc":
          return results.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        case "title_desc":
          return results.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        case "newest":
          return results.sort((a, b) => (b.id || 0) > (a.id || 0) ? 1 : -1);
        case "oldest":
          return results.sort((a, b) => (a.id || 0) > (b.id || 0) ? 1 : -1);
        default:
          return results;
      }
    },
  },
});
