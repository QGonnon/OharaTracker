import { defineComponent, computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Menu from '../../../Shared/Menu/Menu.vue';
import Button from 'primevue/button'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import { useAuthStore } from '../../../../store/auth.module';
import SubscriptionService from '../../../../services/subscription.service';
import AuthService from '../../../../services/auth.service';
import { useSeo } from '../../../../seo/useSeo';
import { breadcrumbJsonLd, faqJsonLd, pricingJsonLd } from '../../../../seo/jsonld';
import { DEFAULT_LOCALE, isLocale, homePath, pagePath, type Locale } from '../../../../seo/config';
import { localePath } from '../../../../seo/localePath';

const PLAN_LEVEL: Record<string, number> = { Free: 0, Lite: 1, Pro: 2 };

export default defineComponent({
  name: 'Pricing',
  components: { Menu, Button, Accordion, AccordionPanel, AccordionHeader, AccordionContent },
  setup() {
    const { tm, t, locale } = useI18n();

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
        // La FAQ de la page est déjà rédigée et traduite : la déclarer en
        // `FAQPage` la rend éligible aux questions dépliables sous le résultat.
        faqJsonLd(tm('faq.items') as { q: string; a: string }[]),
        breadcrumbJsonLd([
          { name: t('seo.breadcrumb.home'), path: homePath(seoLocale.value) },
          { name: t('seo.pricing.title'), path: pagePath('pricing', seoLocale.value) },
        ]),
      ]),
    });
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
      try {
        const { url } = isPlanChange(plan)
          ? await SubscriptionService.createPlanChangeSession(plan)
          : await SubscriptionService.createCheckoutSession(plan);
        window.location.href = url;
      } catch (error) {
        console.error('Erreur lors de la création de la session de paiement:', error);
        checkoutLoadingPlan.value = null;
      }
    }

    return {
      faqItems,
      contactLink: computed(() => localePath('contact')),
      checkoutLoadingPlan,
      handleCheckout,
      isLiteDisabled,
      isProDisabled,
      liteCtaLabel,
      proCtaLabel,
    };
  },
});
