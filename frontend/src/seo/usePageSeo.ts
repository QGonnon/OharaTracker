import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSeo } from './useSeo'
import { breadcrumbJsonLd } from './jsonld'
import { homePath, pagePath, type Locale, type PageKey } from './config'
import { DEFAULT_LOCALE, isLocale } from './config'

/**
 * SEO d'une page fixe en une ligne : le titre et la description sont lus dans
 * `seo.<pageKey>` des fichiers de locale, donc traduits dans les cinq langues
 * sans rien écrire dans le composant.
 *
 * @param pageKey  page concernée (même clé que dans le router et `PAGE_SEGMENTS`)
 * @param options.noindex  pages privées : exclues de l'index et du fil d'Ariane
 */
export function usePageSeo(pageKey: PageKey, options: { noindex?: boolean } = {}) {
  const { t, locale } = useI18n()

  const currentLocale = computed<Locale>(() =>
    isLocale(locale.value) ? locale.value : DEFAULT_LOCALE
  )

  // Fil d'Ariane à deux niveaux (Accueil > la page) : inutile de le générer
  // pour une page non indexée, Google ne la verra jamais.
  const jsonLd = computed(() =>
    options.noindex
      ? []
      : [
          breadcrumbJsonLd([
            { name: t('seo.breadcrumb.home'), path: homePath(currentLocale.value) },
            { name: t(`seo.${pageKey}.title`), path: pagePath(pageKey, currentLocale.value) },
          ]),
        ]
  )

  return useSeo({
    target: { type: 'page', key: pageKey },
    title: computed(() => t(`seo.${pageKey}.title`)),
    description: computed(() => t(`seo.${pageKey}.description`)),
    noindex: options.noindex,
    jsonLd,
  })
}
