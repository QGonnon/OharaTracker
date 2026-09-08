import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { localeHome, localePath } from '../../../seo/localePath'

// TODO: remplacer par l'URL réelle du compte Twitter / X d'Ohara Tracker une fois créé.
const TWITTER_URL = 'https://x.com/REPLACE_ME'
const DISCORD_URL = 'https://discord.gg/DfsFuSdDp'

export default defineComponent({
  name: 'AppFooter',
  setup() {
    const { t } = useI18n()

    const year = new Date().getFullYear()

    // Le footer est le maillage interne principal du site : c'est lui qui donne
    // à Google un chemin vers chaque page depuis n'importe où. Les liens pointent
    // sur l'URL canonique localisée, sans passer par une redirection.
    const columns = computed(() => [
      {
        title: t('footer.product'),
        links: [
          { label: t('footer.about'),            to: localeHome()               },
          { label: t('nav.discovery'),           to: localePath('discovery')    },
          { label: t('footer.pricing'),          to: localePath('pricing')      },
          { label: t('footer.supported_sites'),  to: localePath('supportedSites') },
          { label: t('footer.status'),           to: localePath('status')       },
        ],
      },
      {
        title: t('footer.resources'),
        links: [
          { label: t('footer.blog'),               to: localePath('blog')             },
          { label: t('footer.changelog'),          to: localePath('changelog')        },
          { label: t('footer.suggestions'),        to: localePath('suggestions')      },
          { label: t('footer.official_partners'),  to: localePath('officialPartners') },
        ],
      },
      {
        title: t('footer.legal'),
        links: [
          { label: t('footer.terms'),   to: localePath('terms')   },
          { label: t('footer.privacy'), to: localePath('privacy') },
          { label: t('footer.cookies'), to: localePath('cookies') },
        ],
      },
    ])

    const homeLink = computed(() => localeHome())
    const contactLink = computed(() => localePath('contact'))

    return {
      year,
      columns,
      homeLink,
      contactLink,
      DISCORD_URL,
      TWITTER_URL,
    }
  },
})
