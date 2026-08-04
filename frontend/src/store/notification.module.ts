import { defineStore } from 'pinia';
import NotificationService from '../services/notification.service';
import { useAuthStore } from './auth.module';
import type { AppNotification } from '../types/index';

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string;
  pushEnabled: boolean;
  pushSupported: boolean;
  pushError: string;
}

// Convertit la clé publique VAPID (base64 URL-safe) au format Uint8Array attendu par pushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    items: [],
    unreadCount: 0,
    loading: false,
    error: '',
    pushEnabled: false,
    pushSupported: 'serviceWorker' in navigator && 'PushManager' in window,
    pushError: '',
  }),

  actions: {
    async fetchNotifications(opts: { unreadOnly?: boolean; limit?: number } = {}) {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) return;

      this.loading = true;
      this.error = '';
      try {
        this.items = await NotificationService.getNotifications(token, opts);
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications';
      } finally {
        this.loading = false;
      }
    },

    async fetchUnreadCount() {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) return;

      try {
        this.unreadCount = await NotificationService.getUnreadCount(token);
      } catch (err) {
        console.error('Erreur lors du comptage des notifications:', err);
      }
    },

    async markAsRead(id: number) {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) return;

      const target = this.items.find(n => n.id === id);
      const wasUnread = !!target && !target.isRead;
      if (target) target.isRead = true;
      if (wasUnread) this.unreadCount = Math.max(0, this.unreadCount - 1);

      try {
        await NotificationService.markAsRead(token, id);
      } catch (err) {
        console.error('Erreur lors du marquage de la notification:', err);
      }
    },

    async markAllAsRead() {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) return;

      this.items.forEach(n => { n.isRead = true; });
      this.unreadCount = 0;

      try {
        await NotificationService.markAllAsRead(token);
      } catch (err) {
        console.error('Erreur lors du marquage global des notifications:', err);
      }
    },

    async remove(id: number) {
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      if (!token) return;

      const target = this.items.find(n => n.id === id);
      const wasUnread = !!target && !target.isRead;
      this.items = this.items.filter(n => n.id !== id);
      if (wasUnread) this.unreadCount = Math.max(0, this.unreadCount - 1);

      try {
        await NotificationService.deleteNotification(token, id);
      } catch (err) {
        console.error('Erreur lors de la suppression de la notification:', err);
      }
    },

    // Écoute les messages envoyés par le Service Worker (push reçu pendant que l'onglet est ouvert)
    // pour rafraîchir le badge sans attendre un rechargement. Sans effet si le SW n'est pas supporté.
    listenForServiceWorkerMessages() {
      if (!this.pushSupported) return;
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notifications-refresh') {
          this.fetchUnreadCount();
        }
      });
    },

    // Doit être appelé depuis un geste utilisateur (clic) : demande la permission navigateur,
    // s'abonne au Push Manager et enregistre l'abonnement côté backend.
    // Distingue le refus explicite de permission (permission-denied) d'un échec technique de
    // l'abonnement (subscribe-failed, ex. Push Manager du navigateur ou appel backend en échec) :
    // les deux se traduisaient auparavant par le même message trompeur "permission refusée".
    async initPush(): Promise<'granted' | 'permission-denied' | 'subscribe-failed' | 'unsupported'> {
      this.pushError = '';
      const authStore = useAuthStore();
      const token = authStore.currentUser?.accessToken;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!this.pushSupported || !token || !vapidKey) return 'unsupported';

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return 'permission-denied';

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await NotificationService.subscribePush(token, subscription);
        this.pushEnabled = true;
        return 'granted';
      } catch (err) {
        this.pushError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        console.error('Erreur lors de l\'activation des notifications push:', err);
        return 'subscribe-failed';
      }
    },
  },
});
