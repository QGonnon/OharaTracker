import { defineStore } from 'pinia';
import MangaService from '../services/manga.service';
import type { Manga, MediaKind } from '../types/index';

interface MangaState {
  items: Manga[];
  /** Catalogue allégé (sans les chapitres), caché séparément du catalogue complet. */
  light: Manga[];
  loading: boolean;
  error: string;
  loaded: boolean;
  lightLoaded: boolean;
}

// Enveloppe Pinia autour de MangaService : centralise le cache de la liste des
// oeuvres et expose les helpers du service pour que les composants n'appellent
// plus jamais manga.service.ts directement.
export const useMangaStore = defineStore('manga', {
  state: (): MangaState => ({
    items: [],
    light: [],
    loading: false,
    error: '',
    loaded: false,
    lightLoaded: false,
  }),

  actions: {
    // Récupère toutes les oeuvres et met le cache à jour. Le catalogue ne change pas
    // d'un composant à l'autre : une fois chargé, on réutilise le cache tant que
    // `force` n'est pas demandé (ex: bouton de rechargement manuel), pour limiter les GET.
    async fetchAll(force = false): Promise<Manga[]> {
      if (this.loaded && !force) return this.items;

      this.loading = true;
      this.error = '';
      try {
        this.items = await MangaService.getAll();
        this.loaded = true;
        return this.items;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Erreur lors du chargement des mangas';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Catalogue allégé (sans les chapitres), mis en cache comme `fetchAll`.
     * À préférer partout où seules les vignettes sont affichées.
     */
    async fetchLight(force = false): Promise<Manga[]> {
      if (this.lightLoaded && !force) return this.light;

      this.loading = true;
      this.error = '';
      try {
        this.light = await MangaService.getLight();
        this.lightLoaded = true;
        return this.light;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Erreur lors du chargement du catalogue';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /** Une seule œuvre, résolue par son slug côté serveur. */
    async fetchBySlug(slug: string): Promise<Manga | null> {
      return MangaService.getBySlug(slug);
    },

    // Chapitres/épisodes connus pour une entrée de bibliothèque donnée
    getChaptersForLibrary(idLibrary: number) {
      return MangaService.getChaptersForLibrary(idLibrary);
    },

    findBySlug(mangas: Manga[], slug: string | string[]): Manga | undefined {
      return MangaService.findBySlug(mangas, slug);
    },

    getCoverUrl(manga: Pick<Manga, 'coverPath' | 'coverUrl' | 'title'>): string {
      return MangaService.getCoverUrl(manga);
    },

    getBestSiteKey(manga: Manga): string {
      return MangaService.getBestSiteKey(manga);
    },

    getLastChapterInfo(manga: Manga): { chapter?: string; chapterUrl?: string } {
      return MangaService.getLastChapterInfo(manga);
    },

    getSeasonEpisodeStats(manga: Manga): { totalEpisodes?: number; totalSeasons?: number } {
      return MangaService.getSeasonEpisodeStats(manga);
    },

    isAnimeType(manga: Pick<Manga, 'type' | 'sites'>): boolean {
      return MangaService.isAnimeType(manga);
    },

    resolveMediaKind(routeName: string | symbol | null | undefined, dbType?: string): MediaKind {
      return MangaService.resolveMediaKind(routeName, dbType);
    },
  },
});
