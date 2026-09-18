import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Menu from '../../../Shared/Menu/Menu.vue'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import { useSeo } from '../../../../seo/useSeo'
import { breadcrumbJsonLd, faqJsonLd } from '../../../../seo/jsonld'
import { DEFAULT_LOCALE, isLocale, homePath, pagePath, type Locale } from '../../../../seo/config'
import { localePath } from '../../../../seo/localePath'

export default defineComponent({
  name: 'Faq',
  components: { Menu, Accordion, AccordionPanel, AccordionHeader, AccordionContent },
  setup() {
    const { tm, t, locale } = useI18n()

    const seoLocale = computed<Locale>(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE))

    // `tm()` renvoie la ressource brute (le tableau), sans interpolation :
    // c'est ce qu'il faut pour une liste statique de questions/réponses.
    const faqItems = computed(() => tm('faq.items') as { q: string; a: string }[])

    useSeo({
      target: { type: 'page', key: 'faq' },
      title: computed(() => t('seo.faq.title')),
      description: computed(() => t('seo.faq.description')),
      jsonLd: computed(() => [
        // Sur une page dédiée, le `FAQPage` porte sur l'intégralité du contenu :
        // c'est la configuration que Google attend pour les questions dépliables
        // dans les résultats de recherche.
        faqJsonLd(faqItems.value),
        breadcrumbJsonLd([
          { name: t('seo.breadcrumb.home'), path: homePath(seoLocale.value) },
          { name: t('seo.faq.title'), path: pagePath('faq', seoLocale.value) },
        ]),
      ]),
    })

    return {
      faqItems,
      pricingLink: computed(() => localePath('pricing')),
      contactLink: computed(() => localePath('contact')),
    }
  },
})
