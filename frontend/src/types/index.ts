// Partagé avec la config SEO : les segments d'URL sont dérivés de ces natures.
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
  /** Moyenne communautaire, ou null tant que les votes sont trop peu nombreux. */
  averageScore?: number | null,
  /** Nombre de notes ayant servi a la moyenne. */
  ratingCount?: number,
  // La note de l'utilisateur vit dans `score` (voir plus haut). Un second champ
  // `userScore`, jamais renseigne, avait fait croire a la fiche qu'elle n'avait
  // pas de note : il est retire pour que l'erreur ne puisse pas se reproduire.
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
  /** 'new_chapter' | 'friend_request' | 'friend_accepted' */
  type: string;
  /** null pour un événement social : il ne porte sur aucune oeuvre. */
  chapter: string | null;
  /** Pseudo à l'origine d'un événement social. */
  actor?: string | null;
  isRead: boolean;
  createdAt: string;
  idLibrary: number | null;
  title: string | null;
  coverPath?: string | null;
  coverUrl?: string | null;
  mediaType?: string | null;
  chapterUrl?: string | null;
  mangaUrl?: string | null;
  site?: string | null;
}
