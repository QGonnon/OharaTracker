/**
 * Types et interfaces centralisés pour l'application
 */

export interface Manga {
  id?: number | string;
  title: string;
  author?: string;
  artist?: string;
  theme?: string;
  status?: string;
  description?: string;
  coverPath?: string;
  coverUrl?: string;
  lastChapter?: string;
  chapterUrl: string;
  mangaUrl: string;
  site: string;
}

export interface User {
  username?: string;
  email?: string;
  displayName?: string;
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
