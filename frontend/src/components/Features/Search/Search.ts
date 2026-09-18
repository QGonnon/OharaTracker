import { defineComponent } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import Tag from "primevue/tag";
import ProgressSpinner from "primevue/progressspinner";
import Menu from "../../Shared/Menu/Menu.vue";
import type { Manga } from "../../../types/index";
import { slugify } from "../../../utils";
import { useMangaStore } from "../../../store/manga.module";
import { usePageSeo } from "../../../seo/usePageSeo";
import { localeMedia } from "../../../seo/localePath";
import { CDN_BASE } from "../../../services/api";

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
  },
  setup() {
    usePageSeo('search');
  },
  data() {
    return {
      searchQuery: "",
      searchResults: [] as Manga[],
      allMangas: [] as Manga[], // Tous les mangas et animes de la BDD
      isLoading: false,
      hasSearched: false,
      viewMode: "grid" as "grid" | "list",
      searchTimeout: null as ReturnType<typeof setTimeout> | null,
      
      // Filters
      selectedGenres: [] as string[],
      selectedStatus: null as string | null,
      selectedYear: null as number | null,
      sortBy: "popularity" as string,
      filterType: "all" as "all" | "anime" | "lecture",
      
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
      
      // Défilement infini
      pageSize: 24,
      visibleCount: 24,
      totalResults: 0,
      scrollObserver: null as IntersectionObserver | null,
      showBackToTop: false,
    };
  },
  async mounted() {
    // Load all mangas from database
    this.loadMangas();
    
    // Load search query from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    if (query) {
      this.searchQuery = query;
    }
    
    // Load filter type from URL if present (anime or lecture)
    const type = urlParams.get("type");
    if (type === "anime") {
      this.filterType = "anime";
    } else if (type === "lecture") {
      this.filterType = "lecture";
    }
    
    this.performSearch();
    this.setupInfiniteScroll();
    window.addEventListener("scroll", this.onScroll, { passive: true });
  },
  beforeUnmount() {
    this.scrollObserver?.disconnect();
    this.scrollObserver = null;
    window.removeEventListener("scroll", this.onScroll);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
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
    filterType() {
      this.performSearch();
    },
  },
  computed: {
    visibleResults(): Manga[] {
      return this.searchResults.slice(0, this.visibleCount);
    },
    hasMore(): boolean {
      return this.visibleCount < this.searchResults.length;
    },
  },
  methods: {
    async loadMangas() {
      try {
        const mangaStore = useMangaStore();
        // Catalogue allégé : la recherche filtre sur titre, genre et statut,
        // elle n'a jamais besoin des chapitres de toutes les sources.
        this.allMangas = await mangaStore.fetchLight();

        // Extraire tous les genres uniques depuis les mangas
        this.extractGenres();
      } catch (error) {
        console.error("❌ Erreur lors du chargement des mangas/animes :", error);
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
        
        // Filter by type (Anime/Lecture)
        if (this.filterType === "anime") {
          results = results.filter(manga => {
            const type = (manga.type || '').toString().toUpperCase();
            return type === 'ANIME';
          });
        } else if (this.filterType === "lecture") {
          results = results.filter(manga => {
            const type = (manga.type || '').toString().toUpperCase();
            return type == 'MANGA' || type == 'MANHWA' || type == 'MANHUA';
          });
        }
        
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
        // Nouvelle recherche : on repart du haut de la liste.
        this.visibleCount = this.pageSize;
        
        // Update URL with search query
        if (this.searchQuery) {
          const url = new URL(window.location.href);
          url.searchParams.set("q", this.searchQuery);
          window.history.pushState({}, "", url);
        }
      } catch (error) {
        // `this.$toast` était appelé ici, mais `ToastService` n'est installé
        // nulle part dans l'application : l'appel était toujours `undefined`,
        // donc sans effet. Retiré plutôt que laissé en faux filet de sécurité.
        console.error("Erreur lors de la recherche:", error);
      } finally {
        this.isLoading = false;
        // La liste vient d'être remplacée : si elle ne remplit pas l'écran,
        // on charge la tranche suivante sans attendre un scroll.
        this.maybeLoadMore();
      }
    },

    resetFilters() {
      this.searchQuery = "";
      this.selectedGenres = [];
      this.selectedStatus = null;
      this.selectedYear = null;
      this.sortBy = "popularity";
      this.filterType = "all";
      this.searchResults = [];
      this.hasSearched = false;
      this.totalResults = 0;
      this.visibleCount = this.pageSize;
    },

    goToManga(manga: Manga) {
      // La nature de l'œuvre et la langue active déterminent le segment d'URL
      // (`/fr/manga/...`, `/es/pelicula/...`) : on passe par le helper plutôt
      // que par un chemin en dur, qui déclencherait une redirection.
      const store = useMangaStore();
      this.$router.push(localeMedia(store.resolveMediaKind(null, manga.type), slugify(manga.title)));
    },

    getCoverUrl(manga: Manga): string {
      if (manga.coverPath) {
        return `${CDN_BASE}/${manga.coverPath}`;
      }
      
      if (manga.coverUrl) {
        return manga.coverUrl;
      }

      // Placeholder servi depuis notre domaine : une image externe aléatoire
      // (picsum) ralentissait le rendu et changeait à chaque chargement.
      return '/cover-placeholder.svg';
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

    onScroll() {
      // Le bouton n'apparaît qu'une fois la première rangée dépassée
      this.showBackToTop = window.scrollY > 600;
    },

    scrollToTop() {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    },

    setupInfiniteScroll() {
      const sentinel = this.$refs.scrollSentinel as HTMLElement | undefined;
      if (!sentinel || typeof IntersectionObserver === "undefined") {
        return;
      }

      // `rootMargin` déclenche le chargement un écran avant la fin, pour que
      // la grille soit déjà remplie quand l'utilisateur arrive en bas.
      this.scrollObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.loadMore();
          }
        },
        { rootMargin: "600px 0px" }
      );
      this.scrollObserver.observe(sentinel);
    },

    loadMore() {
      if (this.isLoading || !this.hasMore) {
        return;
      }

      this.visibleCount = Math.min(
        this.visibleCount + this.pageSize,
        this.searchResults.length
      );

      this.maybeLoadMore();
    },

    // L'observer ne se redéclenche pas tant que le sentinel reste visible
    maybeLoadMore() {
      this.$nextTick(() => {
        const sentinel = this.$refs.scrollSentinel as HTMLElement | undefined;
        if (!sentinel || !this.hasMore) {
          return;
        }
        if (sentinel.getBoundingClientRect().top <= window.innerHeight + 600) {
          this.loadMore();
        }
      });
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
