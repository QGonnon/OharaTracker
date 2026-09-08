import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Menu from '../../../Shared/Menu/Menu.vue'
import { useSeo } from '../../../../seo/useSeo'
import { localeHome, localePath } from '../../../../seo/localePath'

export default defineComponent({
  name: 'NotFound',
  components: { Menu, Button },
  setup() {
    const { t } = useI18n()

    // `noindex` : une 404 ne doit jamais entrer dans l'index. Le vrai statut HTTP
    // 404 est renvoyé par le middleware serveur (api/seo/spa.js), pas ici.
    useSeo({
      target: { type: 'home' },
      title: computed(() => t('errors.not_found.title')),
      description: computed(() => t('errors.not_found.description')),
      noindex: true,
    })

    // Liens de rattrapage : une 404 qui renvoie vers le catalogue récupère une
    // partie du trafic au lieu de le perdre.
    const suggestions = computed(() => [
      { label: t('nav.discovery'), to: localePath('discovery') },
      { label: t('search.title'), to: localePath('search') },
      { label: t('footer.pricing'), to: localePath('pricing') },
    ])

    return { suggestions, home: computed(() => localeHome()) }
  },
})
