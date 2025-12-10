import { defineStore } from 'pinia';
import AuthService from '../services/auth.service';

interface User {
  [key: string]: any;
}

interface AuthState {
  status: {
    loggedIn: boolean;
  };
  user: User | null;
}

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
  },
});