import { defineStore } from 'pinia';
import AuthService from '../services/auth.service';
import { useLibraryStore } from './library.module';
import type { User, AuthState } from '../types/index'

// Restore user only if it exists *and* has an accessToken; otherwise clear it.
let storedUser: User | null = null;
try {
  storedUser = JSON.parse(localStorage.getItem('user') || 'null');
} catch (e) {
  localStorage.removeItem('user');
}

if (!storedUser || !storedUser.accessToken) {
  localStorage.removeItem('user');
  storedUser = null;
}

const initialState: AuthState = storedUser
  ? { status: { loggedIn: true }, user: storedUser }
  : { status: { loggedIn: false }, user: null };

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => initialState,
  
  getters: {
    isLoggedIn: (state) => state.status.loggedIn,
    currentUser: (state) => state.user,
  },
  
  actions: {
    async login(user: any) {
      try {
        const userData = await AuthService.login(user);
        this.status.loggedIn = true;
        this.user = userData;
        return Promise.resolve(userData);
      } catch (error) {
        this.status.loggedIn = false;
        this.user = null;
        return Promise.reject(error);
      }
    },
    
    logout() {
      AuthService.logout();
      this.status.loggedIn = false;
      this.user = null;
      // clientInfo est spécifique à l'utilisateur : on vide le cache pour éviter
      // qu'une prochaine connexion (autre compte) ne réutilise des données périmées.
      useLibraryStore().$reset();
    },
    
    async register(user: any) {
      try {
        const response = await AuthService.register(user);
        this.status.loggedIn = false;
        return Promise.resolve(response.data);
      } catch (error) {
        this.status.loggedIn = false;
        return Promise.reject(error);
      }
    },

    async googleLogin(credential: string) {
      try {
        const userData = await AuthService.googleLogin(credential);
        this.status.loggedIn = true;
        this.user = userData;
        return Promise.resolve(userData);
      } catch (error) {
        this.status.loggedIn = false;
        this.user = null;
        return Promise.reject(error);
      }
    },
  },
});