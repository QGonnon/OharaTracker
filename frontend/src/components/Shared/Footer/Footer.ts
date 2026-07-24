import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'

// TODO: remplacer par l'URL réelle du compte Twitter / X d'Ohara Tracker une fois créé.
const TWITTER_URL = 'https://x.com/REPLACE_ME'
const DISCORD_URL = 'https://discord.gg/DfsFuSdDp'

export default defineComponent({
  name: 'AppFooter',
  setup() {
    const { t } = useI18n()

    const year = new Date().getFullYear()

    const columns = computed(() => [
      {
        title: t('footer.product'),
        links: [
          { label: t('footer.about'),   to: '/home'    },
          { label: t('footer.pricing'), to: '/pricing'  },
          { label: t('footer.supported_sites'),    to: '/supported-sites'    },

          { label: t('footer.status'),  to: '/status'   },
        ],
      },
      {
        title: t('footer.resources'),
        links: [
          { label: t('footer.changelog'),          to: '/changelog'          },
          { label: t('footer.suggestions'),        to: '/suggestions'        },
          { label: t('footer.official_partners'),  to: '/official-partners'  },
        ],
      },
      {
        title: t('footer.legal'),
        links: [
          { label: t('footer.terms'),   to: '/terms'   },
          { label: t('footer.privacy'), to: '/privacy' },
          { label: t('footer.cookies'), to: '/cookies' },
        ],
      },
    ])

    return {
      year,
      columns,
      DISCORD_URL,
      TWITTER_URL,
    }
  },
})
