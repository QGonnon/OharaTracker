import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSeo } from './useSeo'
import { breadcrumbJsonLd } from './jsonld'
import { homePath, pagePath, type Locale, type PageKey } from './config'
import { DEFAULT_LOCALE, isLocale } from './config'

// Titre et description lus dans seo.<pageKey> des fichiers de locale, traduits automatiquement.
export function usePageSeo(pageKey: PageKey, options: { noindex?: boolean } = {}) {
  const { t, locale } = useI18n()

  const currentLocale = computed<Locale>(() =>
    isLocale(locale.value) ? locale.value : DEFAULT_LOCALE
  )

  // Inutile de générer le fil d'Ariane pour une page non indexée.
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
