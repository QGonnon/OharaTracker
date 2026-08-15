import { defineStore } from 'pinia';
import LibraryService from '../services/library.service';
import { useAuthStore } from './auth.module';
import { useMangaStore } from './manga.module';

interface LibraryState {
  clientInfo: any | null;
  loading: boolean;
  error: string;
  loaded: boolean;
}

// Enveloppe Pinia autour de LibraryService : résout le token depuis useAuthStore
// pour que les composants n'aient plus besoin de le passer explicitement, et
// centralise le cache des infos client (dont libraryUsage). Les actions de mutation
// mettent `clientInfo` à jour localement au lieu de re-fetch, pour limiter les GET.
export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    clientInfo: null,
    loading: false,
    error: '',
    loaded: false,
  }),

  actions: {
    // Infos du client connecté (dont libraryUsage : liste des oeuvres suivies).
    // Réutilise le cache tant que `force` n'est pas demandé.
    async fetchClientInfo(force = false): Promise<any> {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) return null;
      if (this.loaded && !force) return this.clientInfo;

      this.loading = true;
      this.error = '';
      try {
        this.clientInfo = await LibraryService.getClientInfo(token);
        this.loaded = true;
        return this.clientInfo;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Erreur lors du chargement de la bibliothèque';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Ajoute une oeuvre à la bibliothèque. Ne throw pas sur 409 (déjà présente) : à l'appelant de gérer.
    // `libraryId` est l'id catalogue de l'oeuvre (déjà connu de l'appelant, cf. manga.module),
    // utilisé pour insérer l'entrée dans le cache sans re-fetch.
    async addToLibrary(libraryId: number, payload: Record<string, any>): Promise<{ ok: boolean; status: number; data: any }> {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) throw new Error('Utilisateur non authentifié');
      const result = await LibraryService.addToLibrary(token, payload);
      if (result.ok && this.clientInfo) {
        const usage = this.clientInfo.libraryUsage ?? [];
        const entry = {
          libraryId,
          lastReadChapter: payload.lastChapter ?? null,
          readingStatus: null,
          clientScore: null,
          clientNote: null,
        };
        const idx = usage.findIndex((u: any) => u.libraryId === libraryId);
        if (idx >= 0) usage[idx] = { ...usage[idx], ...entry };
        else usage.push(entry);
        this.clientInfo.libraryUsage = usage;
      }
      return result;
    },

    // Met à jour l'entrée de bibliothèque de l'utilisateur (chapitre lu, statut, notifications...)
    async updateLibraryEntry(payload: Record<string, any>): Promise<any> {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) throw new Error('Utilisateur non authentifié');
      const resJson = await LibraryService.updateLibraryEntry(token, payload);
      const libraryId = resJson?.idLibrary;
      if (libraryId !== undefined && this.clientInfo?.libraryUsage) {
        const usage = this.clientInfo.libraryUsage;
        const idx = usage.findIndex((u: any) => u.libraryId === libraryId);
        if (idx >= 0) {
          usage[idx] = {
            ...usage[idx],
            lastReadChapter: payload.lastChapter,
            readingStatus: payload.readingStatus,
            ...(payload.notifyEnabled !== undefined ? { notifyEnabled: payload.notifyEnabled } : {}),
          };
        }
      }
      return resJson;
    },

    // Supprime une oeuvre de la bibliothèque de l'utilisateur. Résout l'id via le
    // cache du manga store (par titre) pour retirer l'entrée du cache sans re-fetch.
    async deleteFromLibrary(payload: Record<string, any>): Promise<void> {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) throw new Error('Utilisateur non authentifié');
      await LibraryService.deleteFromLibrary(token, payload);
      if (this.clientInfo?.libraryUsage) {
        const mangaStore = useMangaStore();
        const matched = mangaStore.items.find(m => m.title === payload.title);
        if (matched) {
          this.clientInfo.libraryUsage = this.clientInfo.libraryUsage.filter((u: any) => u.libraryId !== matched.id);
        }
      }
    },
  },
});
