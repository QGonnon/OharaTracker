/**
 * Types et interfaces centralisés pour l'application
 */

export type MediaKind = 'lecture' | 'serie' | 'film'

export interface Manga {
  id?: number | string;
  title: string;
  /** Type de média - remplace l'ancien 'Manga' | 'Anime' */
  type?: MediaKind | 'Manga' | 'Anime'; // union large pour compatibilité pendant la migration
  author?: string;
  artist?: string;
  /** Utilisé pour lecture : nom des sources */
  site: string;
  theme?: string;
  status?: string;
  description?: string;
  releaseDate?: string;       // date de parution
  averageScore?: number;      // score moyen des sources
  userScore?: number;         // score utilisateur Ohara
  // lecture
  lastChapter?: string;
  userLastChapter?: string;
  chapterUrl: string;
  mangaUrl: string;
  // serie
  totalEpisodes?: number;
  totalSeasons?: number;
  lastEpisode?: string;
  userLastEpisode?: string;
  // film & serie
  studio?: string;
  // legacy
  coverPath?: string;
  coverUrl?: string;
  readingStatus?: string;
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
