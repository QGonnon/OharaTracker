/**
 * Types et interfaces centralisés pour l'application
 */

// Définition unique, partagée avec la configuration SEO : les segments d'URL
// (`/manga`, `/anime`, `/film`) sont dérivés de ces trois natures, donc toute
// valeur supplémentaire ici produirait une URL que le router ne sait pas générer.
export type { MediaKind } from '../seo/config';

export interface Manga {
  id?: number,
  title: string,
  type: string,
  theme: string,
  status: string,
  description: string,
  author: string,
  artist: string,
  coverPath: string,
  coverUrl: string,
  sites: {
    [key: string]: {
      site: string,
      mangaUrl: string,
      chapterUrl: string,
      chapters: { chapter: string, url: string, chapterUrl: string, site: string }[]
    }
  },
  // User library fields
  userLastChapter?: string,
  readingStatus?: string,
  score?: number | null,
  note?: string | null,
  // Derived flat fields for template convenience
  lastChapter?: string,
  chapterUrl?: string,
  site?: string,
  // Métadonnées additionnelles (séries/films notamment)
  studio?: string,
  totalEpisodes?: number | string,
  totalSeasons?: number | string,
  releaseDate?: string,
  averageScore?: number,
  userScore?: number | null,
}

export interface User {
  username?: string;
  email?: string;
  name?: string;
  role?: 'user' | 'moderator' | 'admin';
  accessToken?: string;
  [key: string]: any;
}

export interface AuthState {
  status: {
    loggedIn: boolean;
  };
  user: User | null;
}

export interface ChapterInfo {
  id?: string;
  title?: string;
  number?: string;
  url?: string;
  date?: string;
}

export interface AppNotification {
  id: number;
  type: string;
  chapter: string;
  isRead: boolean;
  createdAt: string;
  idLibrary: number;
  title: string;
  coverPath?: string | null;
  coverUrl?: string | null;
  mediaType?: string | null;
  chapterUrl?: string | null;
  mangaUrl?: string | null;
  site?: string | null;
}
