import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Menu from '../../../Shared/Menu/Menu.vue';
import Button from 'primevue/button'
import { useAuthStore } from '../../../../store/auth.module';
import SubscriptionService from '../../../../services/subscription.service';
import AuthService from '../../../../services/auth.service';
import { useSeo } from '../../../../seo/useSeo';
import { breadcrumbJsonLd, pricingJsonLd } from '../../../../seo/jsonld';
import { DEFAULT_LOCALE, isLocale, homePath, pagePath, type Locale } from '../../../../seo/config';
import { localePath } from '../../../../seo/localePath';

const PLAN_LEVEL: Record<string, number> = { Free: 0, Lite: 1, Pro: 2 };

export default defineComponent({
  name: 'Pricing',
  components: { Menu, Button },
  setup() {
    const { t, locale } = useI18n();

    const seoLocale = computed<Locale>(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE));

    /** Prix affichés, normalisés pour schema.org (point décimal, sans symbole). */
    const numericPrice = (raw: string) =>
      String(raw ?? '').replace(/[^\d.,]/g, '').replace(',', '.') || '0';

    useSeo({
      target: { type: 'page', key: 'pricing' },
      title: computed(() => t('seo.pricing.title')),
      description: computed(() => t('seo.pricing.description')),
      jsonLd: computed(() => [
        // Offres : Google peut afficher le prix directement dans les résultats.
        pricingJsonLd({
          locale: seoLocale.value,
          description: t('static.pricing.desc'),
          offers: [
            {
              name: t('static.pricing.lite_title'),
              price: numericPrice(t('static.pricing.lite_price')),
              currency: 'EUR',
            },
            {
              name: t('static.pricing.pro_title'),
              price: numericPrice(t('static.pricing.pro_price')),
              currency: 'EUR',
            },
          ],
        }),
        breadcrumbJsonLd([
          { name: t('seo.breadcrumb.home'), path: homePath(seoLocale.value) },
          { name: t('seo.pricing.title'), path: pagePath('pricing', seoLocale.value) },
        ]),
      ]),
    });
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();
    const checkoutLoadingPlan = ref<'lite' | 'pro' | null>(null);
    const currentPlanName = ref('Free');
    const checkoutOutcome = ref<'success' | 'pending' | 'slow' | 'cancel' | null>(null);

    const refreshPlan = async () => {
      if (!authStore.isLoggedIn) return currentPlanName.value;
      try {
        const me = await AuthService.getMe();
        currentPlanName.value = me.subscription || 'Free';
      } catch (error) {
        currentPlanName.value = 'Free';
      }
      return currentPlanName.value;
    };

    // Le paiement et l'activation sont deux choses distinctes : Stripe redirige
    // dès le paiement, mais c'est le webhook qui change l'offre en base, un peu
    // plus tard. On attend donc que l'offre bouge réellement avant de l'annoncer,
    // au lieu d'affirmer « votre offre X est active » en relisant une valeur
    // périmée — ce qui affichait « votre offre Free est active » après un achat.
    const ACTIVATION_ATTEMPTS = 10;
    const ACTIVATION_DELAY_MS = 2000;
    let activationTimer: ReturnType<typeof setTimeout> | null = null;

    const waitForActivation = async (planBeforeCheckout: string) => {
      for (let attempt = 0; attempt < ACTIVATION_ATTEMPTS; attempt++) {
        await new Promise<void>(resolve => { activationTimer = setTimeout(resolve, ACTIVATION_DELAY_MS); });
        if (await refreshPlan() !== planBeforeCheckout) {
          checkoutOutcome.value = 'success';
          return;
        }
      }
      // L'offre n'a pas bougé : le dire franchement plutôt que de laisser croire
      // que tout s'est bien passé.
      checkoutOutcome.value = 'slow';
    };

    onMounted(async () => {
      await refreshPlan();

      const outcome = route.query.checkout;
      const sessionId = route.query.session_id;
      if (outcome === 'success' || outcome === 'cancel') {
        router.replace({ path: route.path, query: {} });

        if (outcome === 'cancel') {
          checkoutOutcome.value = 'cancel';
          return;
        }

        // Stripe renvoie sur l'origine declaree par SITE_URL cote serveur. Si ce
        // n'est pas celle d'ou le client est parti, il revient sur une autre
        // origine, donc sans sa session (localStorage est cloisonne par origine).
        // Le dire tout de suite plutot que d'attendre vingt secondes pour rien.
        if (!authStore.isLoggedIn) {
          checkoutOutcome.value = 'slow';
          return;
        }

        const planBefore = currentPlanName.value;
        checkoutOutcome.value = 'pending';

        // Chemin direct : on demande au serveur de relire la session de paiement
        // et d'activer l'offre tout de suite. L'attente ci-dessous reste le filet
        // pour les retours sans identifiant de session (portail de facturation).
        if (typeof sessionId === 'string' && sessionId) {
          try {
            const { plan } = await SubscriptionService.confirmSession(sessionId);
            currentPlanName.value = plan;
            checkoutOutcome.value = 'success';
            return;
          } catch (error) {
            console.error('Confirmation de la session de paiement impossible:', error);
          }
        }

        waitForActivation(planBefore);
      }
    });

    onUnmounted(() => {
      if (activationTimer) clearTimeout(activationTimer);
    });

    function isCurrentPlan(planKey: 'lite' | 'pro') {
      const targetName = planKey === 'lite' ? 'Lite' : 'Pro';
      return currentPlanName.value === targetName;
    }

    // Le client a déjà un abonnement payant différent de celui-ci : upgrade ou downgrade.
    function isPlanChange(planKey: 'lite' | 'pro') {
      const currentLevel = PLAN_LEVEL[currentPlanName.value] ?? 0;
      return currentLevel > 0 && !isCurrentPlan(planKey);
    }

    function isUpgrade(planKey: 'lite' | 'pro') {
      const targetLevel = PLAN_LEVEL[planKey === 'lite' ? 'Lite' : 'Pro'];
      const currentLevel = PLAN_LEVEL[currentPlanName.value] ?? 0;
      return currentLevel > 0 && currentLevel < targetLevel;
    }

    function isDowngrade(planKey: 'lite' | 'pro') {
      const targetLevel = PLAN_LEVEL[planKey === 'lite' ? 'Lite' : 'Pro'];
      const currentLevel = PLAN_LEVEL[currentPlanName.value] ?? 0;
      return currentLevel > 0 && currentLevel > targetLevel;
    }

    function planLabel(planKey: 'lite' | 'pro', defaultLabel: string) {
      if (isCurrentPlan(planKey)) return t('static.pricing.current_plan_cta');
      if (isUpgrade(planKey)) return t('static.pricing.upgrade_cta');
      if (isDowngrade(planKey)) return t('static.pricing.downgrade_cta');
      return defaultLabel;
    }

    // Seul le plan déjà actif est désactivé ; upgrade et downgrade restent cliquables.
    const isLiteDisabled = computed(() => isCurrentPlan('lite'));
    const isProDisabled = computed(() => isCurrentPlan('pro'));
    const liteCtaLabel = computed(() => planLabel('lite', t('static.pricing.lite_cta')));
    const proCtaLabel = computed(() => planLabel('pro', t('static.pricing.pro_cta')));

    async function handleCheckout(plan: 'lite' | 'pro') {
      if (!authStore.isLoggedIn) {
        router.push({ path: localePath('register'), query: { redirect: localePath('pricing') } });
        return;
      }

      checkoutLoadingPlan.value = plan;
      checkoutOutcome.value = null;
      try {
        const { url } = isPlanChange(plan)
          ? await SubscriptionService.createPlanChangeSession(plan, locale.value)
          : await SubscriptionService.createCheckoutSession(plan, locale.value);
        window.location.href = url;
      } catch (error) {
        console.error('Erreur lors de la création de la session de paiement:', error);
        checkoutLoadingPlan.value = null;
      }
    }

    return {
      faqLink: computed(() => localePath('faq')),
      contactLink: computed(() => localePath('contact')),
      checkoutLoadingPlan,
      checkoutOutcome,
      currentPlanName,
      handleCheckout,
      isLiteDisabled,
      isProDisabled,
      liteCtaLabel,
      proCtaLabel,
    };
  },
});
