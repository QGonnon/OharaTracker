import { defineComponent } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import Tag from "primevue/tag";
import ProgressSpinner from "primevue/progressspinner";
import Paginator from "primevue/paginator";
import Menu from "../../Common/Menu/Menu.vue";
import type { Manga } from "../../../types/index";
import { slugify } from "../../../utils";

interface SortOption {
  label: string;
  value: string;
}

export default defineComponent({
  name: "Search",
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
      allMangas: [] as Manga[], // Tous les mangas de la BDD
      isLoading: false,
      hasSearched: false,
      viewMode: "grid" as "grid" | "list",
      searchTimeout: null as ReturnType<typeof setTimeout> | null,
      
      // Filters
      selectedGenres: [] as string[],
      selectedStatus: null as string | null,
      selectedYear: null as number | null,
      sortBy: "popularity" as string,
      
      // Filter options
      genres: [] as string[], // Sera rempli dynamiquement depuis la BDD
      
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
      
      // Pagination
      itemsPerPage: 12,
      totalResults: 0,
      currentPage: 0,
    };
  },
  mounted() {
    // Load all mangas from database
    this.loadMangas();
    
    // Load search query from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    if (query) {
      this.searchQuery = query;
    }
    this.performSearch();
  },
  watch: {
    searchQuery() {
      // Afficher le spinner immédiatement
      this.isLoading = true;
      
      // Annuler le délai précédent
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Attendre 500ms avant de lancer la recherche
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
        // Exclude anime entries (MovieDB or items marked as ANIME)
        const mangaOnly = (chapters || []).filter((chapter: any) => {
          if (!chapter) return false;
          const site = (chapter.site || '').toString().toLowerCase();
          const type = (chapter.type || '').toString().toUpperCase();
          const theme = (chapter.theme || '').toString().toLowerCase();
          // exclude AniList entries or items explicitly marked as ANIME or with theme containing 'anime'
          if (site === 'moviedb' || type === 'ANIME' || theme.includes('anime')) return false;
          return true;
        });

        const allMangasWithDuplicates = mangaOnly.map((chapter: any) => ({
          id: chapter.chapterId,
          title: chapter.title,
          author: chapter.author,
          theme: chapter.theme,
          status: chapter.status,
          description: chapter.description,
          coverPath: chapter.coverPath,
          coverUrl: chapter.coverUrl,
          lastChapter: chapter.lastChapter,
          chapterUrl: chapter.chapterUrl,
          mangaUrl: chapter.mangaUrl,
          site: chapter.site,
        }));
        
        // Dédupliquer les mangas par titre
        const mangaMap = new Map<string, Manga>();
        allMangasWithDuplicates.forEach((manga: Manga) => {
          const normalizedTitle = manga.title?.toLowerCase().trim();
          if (normalizedTitle && !mangaMap.has(normalizedTitle)) {
            mangaMap.set(normalizedTitle, manga);
          }
        });
        
        this.allMangas = Array.from(mangaMap.values());
        
        // Extraire tous les genres uniques depuis les mangas
        this.extractGenres();
      } catch (error) {
        console.error("❌ Erreur lors du chargement des mangas :", error);
      }
    },

    extractGenres() {
      const genresSet = new Set<string>();
      
      this.allMangas.forEach((manga) => {
        if (manga.theme) {
          // Séparer les genres s'ils sont séparés par des virgules, des points-virgules, ou des pipes
          const themeGenres = manga.theme
            .split(/[,;|]+/)
            .map(g => g.trim())
            .filter(g => g.length > 0);
          
          themeGenres.forEach(genre => genresSet.add(genre));
        }
      });
      
      // Trier les genres par ordre alphabétique
      this.genres = Array.from(genresSet).sort((a, b) => a.localeCompare(b));
    },

    async performSearch() {
      this.isLoading = true;
      this.hasSearched = true;

      // Petit délai pour éviter trop de re-rendus
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Filter mangas based on search criteria
        let results = [...this.allMangas];
        
        // Text search (title, author, description)
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          results = results.filter(manga => 
            manga.title?.toLowerCase().includes(query) ||
            manga.author?.toLowerCase().includes(query) ||
            manga.description?.toLowerCase().includes(query)
          );
        }
        
        // Filter by genres (theme)
        if (this.selectedGenres.length > 0) {
          results = results.filter(manga => 
            this.selectedGenres.some(genre => 
              manga.theme?.toLowerCase().includes(genre.toLowerCase())
            )
          );
        }
        
        // Filter by status
        if (this.selectedStatus) {
          results = results.filter(manga => 
            manga.status?.toLowerCase() === this.selectedStatus?.toLowerCase()
          );
        }
        
        // Sort results
        results = this.sortResults(results);
        
        this.searchResults = results;
        this.totalResults = results.length;
        // Reset to first page when new search performed
        this.currentPage = 0;
        
        // Update URL with search query
        if (this.searchQuery) {
          const url = new URL(window.location.href);
          url.searchParams.set("q", this.searchQuery);
          window.history.pushState({}, "", url);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        this.$toast?.add({
          severity: "error",
          summary: "Erreur",
          detail: "Une erreur est survenue lors de la recherche",
          life: 3000,
        });
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

    goToManga(manga: Manga) {
      const cleanTitle = slugify(manga.title);
      this.$router.push(`/manga/${cleanTitle}`);
    },

    getCoverUrl(manga: Manga): string {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      if (manga.coverPath) {
        return `${apiBase}/cdn/${manga.coverPath}`;
      }
      
      if (manga.coverUrl) {
        return manga.coverUrl;
      }
      
      // Fallback image
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
