import { defineComponent, computed } from 'vue';
import { useAuthStore } from '../../../../store/auth.module';
import { useNotificationStore } from '../../../../store/notification.module';
import Menu from '../../../Shared/Menu/Menu.vue';
import AuthService from '../../../../services/auth.service';
import SubscriptionService from '../../../../services/subscription.service';
import CommunityService from '../../../../services/community.service';
import PreferencesService, {
  appearanceService, featureService, accountService,
  type FeatureMatrix,
} from '../../../../services/preferences.service';
import { usePageSeo } from '../../../../seo/usePageSeo';
import { localePath } from '../../../../seo/localePath';
import { LOCALES } from '../../../../seo/config';
import { setLocale } from '../../../../i18n';

// Sections de la colonne de navigation, dans l'ordre d'apparition.
const SECTIONS = ['account', 'security', 'appearance', 'notifications', 'preferences', 'plan', 'danger'];

export default defineComponent({
  name: 'Profile',
  components: { Menu },

  setup() {
    usePageSeo('profile', { noindex: true });
    return {
      pricingLink: computed(() => localePath('pricing')),
      sections: SECTIONS,
      availableLocales: LOCALES,
    };
  },

  data() {
    const authStore = useAuthStore();
    const user = authStore.currentUser;
    return {
      activeSection: 'account',
      observer: null as IntersectionObserver | null,

      isGoogleUser: false,
      hasPassword: true,
      subscriptionName: 'Free',
      hasActiveStripeSubscription: false,
      portalLoading: false,
      subscriptionError: '',

      profileForm: { username: user?.username || '', email: user?.email || '' },
      profileLoading: false,
      profileSuccess: '',
      profileError: '',

      passwordForm: { currentPassword: '', newPassword: '', confirmPassword: '' },
      passwordLoading: false,
      passwordSuccess: '',
      passwordError: '',

      emailDigestEnabled: true,
      emailDigestDay: 0,
      canChooseDigestDay: false,
      accountLocale: '',
      profilePublic: false,
      preferencesLoading: false,
      preferencesSuccess: '',
      preferencesError: '',

      avatarUrl: '',
      bannerUrl: '',
      theme: 'default',
      themes: [] as string[],
      appearanceUnlocked: false,
      appearanceLoading: false,
      appearanceSuccess: '',
      appearanceError: '',

      features: null as FeatureMatrix | null,

      deleteConfirm: '',
      deleteLoading: false,
      deleteError: '',
    };
  },

  computed: {
    currentUser() {
      return useAuthStore().currentUser;
    },
    userInitial(): string {
      return (this.currentUser?.username?.charAt(0)?.toUpperCase()) || 'U';
    },
    pushStore() {
      return useNotificationStore();
    },
    deleteArmed(): boolean {
      return this.deleteConfirm === this.currentUser?.username;
    },
    passwordStrength(): number {
      const p = this.passwordForm.newPassword;
      if (!p) return 0;
      let score = 0;
      if (p.length >= 8) score++;
      if (/[A-Z]/.test(p)) score++;
      if (/[0-9]/.test(p)) score++;
      if (/[^A-Za-z0-9]/.test(p)) score++;
      return score;
    },
    passwordStrengthLabel(): string {
      return ['', 'Très faible', 'Faible', 'Moyen', 'Fort'][this.passwordStrength] || '';
    },
    passwordStrengthColor(): string {
      if (this.passwordStrength >= 4) return 'bg-green-500';
      if (this.passwordStrength >= 3) return 'bg-green-400';
      if (this.passwordStrength >= 2) return 'bg-yellow-400';
      return 'bg-red-400';
    },
  },

  async mounted() {
    if (!this.currentUser) {
      this.$router.push({ name: 'Login' });
      return;
    }

    try {
      const fresh = await AuthService.getMe();
      const authStore = useAuthStore();
      if (authStore.user) {
        authStore.user.username = fresh.username;
        authStore.user.email = fresh.email;
      }
      this.isGoogleUser = fresh.isGoogleUser || false;
      this.hasPassword = fresh.hasPassword || false;
      this.subscriptionName = fresh.subscription || 'Free';
      this.hasActiveStripeSubscription = fresh.hasActiveStripeSubscription || false;
      this.profileForm.username = fresh.username;
      this.profileForm.email = fresh.email;

      await Promise.all([this.loadPreferences(), this.loadAppearance(), this.loadFeatures(), this.loadVisibility()]);
      this.observeSections();
    } catch {
      useAuthStore().logout();
      this.$router.push({ name: 'Login' });
    }
  },

  beforeUnmount() {
    this.observer?.disconnect();
  },

  methods: {
    // Surligne l'entrée de menu correspondant à la section réellement à l'écran.
    observeSections() {
      this.observer = new IntersectionObserver(
        entries => {
          const visible = entries.filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          if (visible) this.activeSection = visible.target.id;
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
      );
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el) this.observer.observe(el);
      }
    },

    goToSection(id: string) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSection = id;
    },

    token(): string | undefined {
      return useAuthStore().currentUser?.accessToken;
    },

    async loadPreferences() {
      const token = this.token();
      if (!token) return;
      try {
        const p = await PreferencesService.get(token);
        this.emailDigestEnabled = p.emailDigestEnabled;
        this.emailDigestDay = p.emailDigestDay;
        this.accountLocale = p.locale || this.$i18n.locale;
        this.canChooseDigestDay = p.limits?.chooseDigestDay === true;
      } catch { /* valeurs par défaut conservées */ }
    },

    async loadVisibility() {
      const token = this.token();
      const me = this.currentUser?.username;
      if (!token || !me) return;
      try {
        this.profilePublic = (await CommunityService.profile(token, me)).isPublic === true;
      } catch { /* visibilité indisponible */ }
    },

    async loadAppearance() {
      const token = this.token();
      if (!token) return;
      try {
        const a = await appearanceService.get(token);
        this.avatarUrl = a.avatarUrl ?? '';
        this.bannerUrl = a.bannerUrl ?? '';
        this.theme = a.theme;
        this.themes = a.themes ?? [];
        this.appearanceUnlocked = a.unlocked === true;
      } catch { /* section laissée à ses valeurs par défaut */ }
    },

    async loadFeatures() {
      const token = this.token();
      if (!token) return;
      try {
        this.features = await featureService.get(token);
      } catch { this.features = null; }
    },

    async savePreferences() {
      const token = this.token();
      if (!token) return;

      this.preferencesLoading = true;
      this.preferencesSuccess = '';
      this.preferencesError = '';
      try {
        const saved = await PreferencesService.update(token, {
          emailDigestEnabled: this.emailDigestEnabled,
          emailDigestDay: this.emailDigestDay,
          locale: this.accountLocale,
        });
        this.emailDigestEnabled = saved.emailDigestEnabled;
        this.emailDigestDay = saved.emailDigestDay;
        // La langue du compte pilote aussi celle de l'interface : sans ça, les
        // deux réglages divergeraient sous les yeux de l'utilisateur.
        if (saved.locale) await setLocale(saved.locale as any);
        this.preferencesSuccess = this.$t('profile.preferences_saved');
      } catch (err: any) {
        this.preferencesError = err.message || this.$t('profile.preferences_error');
      } finally {
        this.preferencesLoading = false;
      }
    },

    async toggleVisibility() {
      const token = this.token();
      if (!token) return;
      try {
        this.profilePublic = (await CommunityService.setVisibility(token, !this.profilePublic)).isPublic;
      } catch (err: any) {
        this.preferencesError = err.message || 'Erreur';
      }
    },

    async togglePush() {
      const store = this.pushStore;
      if (store.pushEnabled) await store.disablePush?.();
      else await store.initPush();
    },

    async saveAppearance() {
      const token = this.token();
      if (!token) return;

      this.appearanceLoading = true;
      this.appearanceSuccess = '';
      this.appearanceError = '';
      try {
        const saved = await appearanceService.update(token, {
          avatarUrl: this.avatarUrl.trim() || null,
          bannerUrl: this.bannerUrl.trim() || null,
          theme: this.theme,
        });
        this.avatarUrl = saved.avatarUrl ?? '';
        this.bannerUrl = saved.bannerUrl ?? '';
        this.theme = saved.theme;
        this.appearanceSuccess = this.$t('profile.appearance_saved');
      } catch (err: any) {
        this.appearanceError = err.message || this.$t('profile.appearance_error');
      } finally {
        this.appearanceLoading = false;
      }
    },

    async submitProfile() {
      this.profileLoading = true;
      this.profileSuccess = '';
      this.profileError = '';
      try {
        const updated = await AuthService.updateProfile(this.profileForm);
        const authStore = useAuthStore();
        if (authStore.user) {
          authStore.user.username = updated.username;
          authStore.user.email = updated.email;
          authStore.user.accessToken = updated.accessToken;
        }
        this.profileForm.username = updated.username;
        this.profileForm.email = updated.email;
        this.profileSuccess = updated.message || this.$t('profile.preferences_saved');
      } catch (err: any) {
        this.profileError = err.response?.data?.message || err.message || 'Erreur';
      } finally {
        this.profileLoading = false;
      }
    },

    async submitPassword() {
      this.passwordSuccess = '';
      this.passwordError = '';
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.passwordError = this.$t('profile.password_mismatch');
        return;
      }

      this.passwordLoading = true;
      try {
        const res = await AuthService.changePassword(this.passwordForm);
        this.passwordSuccess = res.message || this.$t('profile.preferences_saved');
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      } catch (err: any) {
        this.passwordError = err.response?.data?.message || err.message || 'Erreur';
      } finally {
        this.passwordLoading = false;
      }
    },

    async toStripePortalManageSubscription() {
      this.portalLoading = true;
      this.subscriptionError = '';
      try {
        const { url } = await SubscriptionService.createPortalSession();
        window.location.href = url;
      } catch (err: any) {
        this.subscriptionError = err.message || this.$t('profile.subscription_error');
        this.portalLoading = false;
      }
    },

    async deleteAccount() {
      const token = this.token();
      if (!token || !this.deleteArmed) return;

      this.deleteLoading = true;
      this.deleteError = '';
      try {
        await accountService.remove(token, this.deleteConfirm);
        useAuthStore().logout();
        this.$router.push({ name: 'Login' });
      } catch (err: any) {
        this.deleteError = err.message || 'Erreur';
        this.deleteLoading = false;
      }
    },

    logout() {
      useAuthStore().logout();
      this.$router.push({ name: 'Login' });
    },
  },
});
