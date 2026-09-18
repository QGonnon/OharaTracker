import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useHead, type ResolvableLink } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import {
  LOCALES, DEFAULT_LOCALE, HREFLANG, OG_LOCALE, SITE_NAME, SITE_URL, TWITTER_HANDLE,
  absoluteUrl, homePath, mediaPath, pagePath,
  type Locale, type MediaKind, type PageKey,
} from './config'

// Identité d'une page indépendamment de la langue, pour construire les URL équivalentes (hreflang).
export type SeoTarget =
  | { type: 'home' }
  | { type: 'page'; key: PageKey }
  | { type: 'media'; kind: MediaKind; slug: string }

const pathFor = (target: SeoTarget, locale: Locale): string => {
  switch (target.type) {
    case 'home': return homePath(locale)
    case 'page': return pagePath(target.key, locale)
    case 'media': return mediaPath(target.kind, target.slug, locale)
  }
}

export interface SeoOptions {
  target: MaybeRefOrGetter<SeoTarget>
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string> // 140-160 caractères, tronquée par Google au-delà
  image?: MaybeRefOrGetter<string | undefined>
  noindex?: MaybeRefOrGetter<boolean>
  jsonLd?: MaybeRefOrGetter<object[] | undefined>
  ogType?: MaybeRefOrGetter<string>
}

// Bannière de partage par défaut, dans la langue de la page.
const defaultOgImage = (locale: Locale) => `/og-default-${locale}.png`

// Nonce CSP posé par le rendu serveur (api/seo/security.js) ; lu une fois, ne change pas.
const cspNonce = (() => {
  if (typeof document === 'undefined') return undefined
  return document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content || undefined
})()

// Pose l'intégralité des signaux SEO d'une page. À appeler une fois par page, dans le setup().
export function useSeo(options: SeoOptions) {
  const { locale } = useI18n()

  const currentLocale = computed<Locale>(() =>
    (LOCALES as readonly string[]).includes(locale.value) ? (locale.value as Locale) : DEFAULT_LOCALE
  )

  const target = computed(() => toValue(options.target))
  const canonicalPath = computed(() => pathFor(target.value, currentLocale.value))
  const canonicalUrl = computed(() => absoluteUrl(canonicalPath.value))

  const fullTitle = computed(() => {
    const raw = toValue(options.title)?.trim() || SITE_NAME
    return raw.includes(SITE_NAME) ? raw : `${raw} | ${SITE_NAME}` // évite "Ohara Tracker | Ohara Tracker"
  })

  const description = computed(() => toValue(options.description) ?? '')
  const noindex = computed(() => Boolean(toValue(options.noindex)))

  const imageUrl = computed(() => {
    const img = toValue(options.image) || defaultOgImage(currentLocale.value)
    return img.startsWith('http') ? img : absoluteUrl(img)
  })

  useHead(computed(() => {
    const loc = currentLocale.value

    // Cast nécessaire : le type unhead pour rel:'alternate' vise les flux RSS et réclame un `type`.
    const alternates = (noindex.value
      ? []
      : [
          ...LOCALES.map(l => ({
            rel: 'alternate',
            hreflang: HREFLANG[l],
            href: absoluteUrl(pathFor(target.value, l)),
          })),
          {
            rel: 'alternate',
            hreflang: 'x-default',
            href: absoluteUrl(pathFor(target.value, DEFAULT_LOCALE)),
          },
        ]) as ResolvableLink[]

    const jsonLd = toValue(options.jsonLd) ?? []

    return {
      htmlAttrs: { lang: HREFLANG[loc] },
      title: fullTitle.value,
      link: [
        { rel: 'canonical', href: canonicalUrl.value },
        ...alternates,
      ],
      meta: [
        { name: 'description', content: description.value },
        {
          name: 'robots',
          content: noindex.value
            ? 'noindex, nofollow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        },

        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:type', content: toValue(options.ogType) || 'website' },
        { property: 'og:title', content: fullTitle.value },
        { property: 'og:description', content: description.value },
        { property: 'og:url', content: canonicalUrl.value },
        { property: 'og:image', content: imageUrl.value },
        { property: 'og:locale', content: OG_LOCALE[loc] },
        ...LOCALES.filter(l => l !== loc).map(l => ({
          property: 'og:locale:alternate',
          content: OG_LOCALE[l],
        })),

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: fullTitle.value },
        { name: 'twitter:description', content: description.value },
        { name: 'twitter:image', content: imageUrl.value },
        ...(TWITTER_HANDLE ? [{ name: 'twitter:site', content: TWITTER_HANDLE }] : []),
      ],
      script: jsonLd.map((block, i) => ({
        key: `ld-${i}`, // stable, sinon unhead accumule les blocs à chaque navigation
        type: 'application/ld+json',
        ...(cspNonce ? { nonce: cspNonce } : {}),
        innerHTML: JSON.stringify(block),
      })),
    }
  }))

  return { canonicalUrl, canonicalPath, currentLocale }
}

export { SITE_URL, SITE_NAME }
