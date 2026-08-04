import { defineComponent, computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Menu from '../../../Shared/Menu/Menu.vue';
import { Button, Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primevue';
import { useAuthStore } from '../../../../store/auth.module';
import SubscriptionService from '../../../../services/subscription.service';
import AuthService from '../../../../services/auth.service';

const PLAN_LEVEL: Record<string, number> = { Free: 0, Lite: 1, Pro: 2 };

export default defineComponent({
  name: 'Pricing',
  components: { Menu, Button, Accordion, AccordionPanel, AccordionHeader, AccordionContent },
  setup() {
    const { tm, t } = useI18n();
    const router = useRouter();
    const authStore = useAuthStore();
    const checkoutLoadingPlan = ref<'lite' | 'pro' | null>(null);
    const currentPlanName = ref('Free');

    // tm() renvoie les ressources brutes (tableaux/objets) sans interpolation,
    // adapté à une liste statique de questions/réponses traduites.
    const faqItems = computed(() => tm('faq.items') as { q: string; a: string }[]);

    onMounted(async () => {
      if (!authStore.isLoggedIn) return;
      try {
        const me = await AuthService.getMe();
        currentPlanName.value = me.subscription || 'Free';
      } catch (error) {
        currentPlanName.value = 'Free';
      }
    });

    function isCurrentPlan(planKey: 'lite' | 'pro') {
      const targetName = planKey === 'lite' ? 'Lite' : 'Pro';
      return currentPlanName.value === targetName;
    }

    // Grisé si le client a déjà ce plan ou un plan supérieur (pas de downgrade via ce bouton).
    function isPlanDisabled(planKey: 'lite' | 'pro') {
      const targetLevel = PLAN_LEVEL[planKey === 'lite' ? 'Lite' : 'Pro'];
      const currentLevel = PLAN_LEVEL[currentPlanName.value] ?? 0;
      return currentLevel > 0 && currentLevel >= targetLevel;
    }

    function planLabel(planKey: 'lite' | 'pro', defaultLabel: string) {
      if (isCurrentPlan(planKey)) return t('static.pricing.current_plan_cta');

      const targetLevel = PLAN_LEVEL[planKey === 'lite' ? 'Lite' : 'Pro'];
      const currentLevel = PLAN_LEVEL[currentPlanName.value] ?? 0;
      if (currentLevel > 0 && currentLevel < targetLevel) return t('static.pricing.upgrade_cta');

      return defaultLabel;
    }

    const isLiteDisabled = computed(() => isPlanDisabled('lite'));
    const isProDisabled = computed(() => isPlanDisabled('pro'));
    const liteCtaLabel = computed(() => planLabel('lite', t('static.pricing.lite_cta')));
    const proCtaLabel = computed(() => planLabel('pro', t('static.pricing.pro_cta')));

    async function handleCheckout(plan: 'lite' | 'pro') {
      if (!authStore.isLoggedIn) {
        router.push({ name: 'Register', query: { redirect: '/pricing' } });
        return;
      }

      checkoutLoadingPlan.value = plan;
      try {
        const { url } = await SubscriptionService.createCheckoutSession(plan);
        window.location.href = url;
      } catch (error) {
        console.error('Erreur lors de la création de la session de paiement:', error);
        checkoutLoadingPlan.value = null;
      }
    }

    return {
      faqItems,
      checkoutLoadingPlan,
      handleCheckout,
      isLiteDisabled,
      isProDisabled,
      liteCtaLabel,
      proCtaLabel,
    };
  },
});
