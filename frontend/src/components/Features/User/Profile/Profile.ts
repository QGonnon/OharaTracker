import { defineComponent, computed } from 'vue';
import { useAuthStore } from '../../../../store/auth.module';
import Menu from '../../../Shared/Menu/Menu.vue';
import AuthService from '../../../../services/auth.service';
import SubscriptionService from '../../../../services/subscription.service';
import { usePageSeo } from '../../../../seo/usePageSeo';
import { localePath } from '../../../../seo/localePath';

export default defineComponent({
  name: 'Profile',
  components: { Menu },

  setup() {
    usePageSeo('profile', { noindex: true });
    return { pricingLink: computed(() => localePath('pricing')) };
  },
  data() {
    const authStore = useAuthStore();
    const user = authStore.currentUser;
    return {
      isGoogleUser: false,
      hasPassword: true,
      subscriptionName: 'Free',
      hasActiveStripeSubscription: false,
      portalLoading: false,
      subscriptionError: '',
      profileForm: {
        username: user?.username || '',
        email: user?.email || ''
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      profileLoading: false,
      profileSuccess: '',
      profileError: '',
      passwordLoading: false,
      passwordSuccess: '',
      passwordError: '',
    };
  },

  computed: {
    currentUser() {
      const authStore = useAuthStore();
      return authStore.currentUser;
    },
    userInitial(): string {
      return (this.currentUser?.username?.charAt(0)?.toUpperCase()) || 'U';
    },
    userRoles(): string[] {
      return this.currentUser?.roles || [];
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
      const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort'];
      return labels[this.passwordStrength] || '';
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
    // Vérifier que le token en localStorage correspond bien à un utilisateur en base.
    // Si l'état local est corrompu (token obsolète), on déconnecte proprement.
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
    } catch (err: any) {
      // Token invalide ou utilisateur introuvable → déconnexion forcée
      const authStore = useAuthStore();
      authStore.logout();
      this.$router.push({ name: 'Login' });
    }
  },

  methods: {
    async submitProfile() {
      this.profileLoading = true;
      this.profileSuccess = '';
      this.profileError = '';
      try {
        const updated = await AuthService.updateProfile(this.profileForm);
        // Mettre à jour le store avec les données retournées (nouveau token inclus)
        const authStore = useAuthStore();
        if (authStore.user) {
          authStore.user.username = updated.username;
          authStore.user.email = updated.email;
          authStore.user.accessToken = updated.accessToken;
        }
        // Synchroniser le formulaire avec les valeurs confirmées par le backend
        this.profileForm.username = updated.username;
        this.profileForm.email = updated.email;
        this.profileSuccess = 'Profil mis à jour avec succès.';
      } catch (err: any) {
        this.profileError = err?.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
      } finally {
        this.profileLoading = false;
      }
    },

    async submitPassword() {
      this.passwordError = '';
      this.passwordSuccess = '';
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.passwordError = 'Les mots de passe ne correspondent pas.';
        return;
      }
      if (this.passwordForm.newPassword.length < 6) {
        this.passwordError = 'Le nouveau mot de passe doit faire au moins 6 caractères.';
        return;
      }
      this.passwordLoading = true;
      try {
        await AuthService.changePassword({
          currentPassword: this.passwordForm.currentPassword,
          newPassword: this.passwordForm.newPassword,
        });
        this.passwordSuccess = 'Mot de passe modifié avec succès.';
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.hasPassword = true;
      } catch (err: any) {
        this.passwordError = err?.response?.data?.message || 'Mot de passe actuel incorrect.';
      } finally {
        this.passwordLoading = false;
      }
    },

    handleLogout() {
      const authStore = useAuthStore();
      authStore.logout();
      this.$router.push({ name: 'Login' });
    },

    async toStripePortalManageSubscription() {
      this.subscriptionError = '';
      this.portalLoading = true;
      try {
        const { url } = await SubscriptionService.createPortalSession();
        window.location.href = url;
      } catch (err: any) {
        this.subscriptionError = err?.response?.data?.message || 'Impossible d\'ouvrir le portail de facturation.';
        this.portalLoading = false;
      }
    },
  },
});
