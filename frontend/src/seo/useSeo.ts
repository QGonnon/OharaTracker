import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useHead, type ResolvableLink } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import {
  LOCALES, DEFAULT_LOCALE, HREFLANG, OG_LOCALE, SITE_NAME, SITE_URL, TWITTER_HANDLE,
  absoluteUrl, homePath, mediaPath, pagePath,
  type Locale, type MediaKind, type PageKey,
} from './config'

/**
 * Identité d'une page indépendamment de la langue : c'est ce qui permet de
 * construire les 5 URL équivalentes d'une même page pour les balises hreflang.
 */
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
  /** Titre de la page, sans le nom du site (ajouté automatiquement). */
  title: MaybeRefOrGetter<string>
  /** Meta description : 140-160 caractères, elle est tronquée par Google au-delà. */
  description: MaybeRefOrGetter<string>
  /** Image de partage (OG/Twitter), absolue ou relative au site. */
  image?: MaybeRefOrGetter<string | undefined>
  /** `true` sur tout ce qui est privé, dupliqué ou sans valeur de recherche. */
  noindex?: MaybeRefOrGetter<boolean>
  /** Blocs JSON-LD (schema.org) injectés dans le `<head>`. */
  jsonLd?: MaybeRefOrGetter<object[] | undefined>
  /** `article` pour un billet de blog, `website` sinon. */
  ogType?: MaybeRefOrGetter<string>
}

/**
 * Bannière de partage par défaut, dans la langue de la page.
 * Générée par `npm run og:image` (voir `scripts/generate-og-image.mjs`).
 */
const defaultOgImage = (locale: Locale) => `/og-default-${locale}.png`

/**
 * Nonce CSP posé par le rendu serveur (`api/seo/security.js`).
 *
 * La politique de sécurité interdit les scripts inline sans nonce : sans lui,
 * les blocs JSON-LD reposés lors d'une navigation interne seraient bloqués par
 * le navigateur, et le site perdrait ses données structurées en cours de visite.
 * Lu une seule fois : la valeur ne change pas pendant la vie du document.
 */
const cspNonce = (() => {
  if (typeof document === 'undefined') return undefined
  return document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content || undefined
})()

/**
 * Pose l'intégralité des signaux SEO d'une page : titre, description, canonical,
 * alternates hreflang pour les 5 langues, Open Graph, Twitter Card, JSON-LD, et
 * l'attribut `lang` du `<html>`.
 *
 * À appeler une fois par page, dans le `setup()`.
 */
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
    // Le titre de l'accueil porte déjà la marque : on évite « Ohara Tracker | Ohara Tracker »
    return raw.includes(SITE_NAME) ? raw : `${raw} | ${SITE_NAME}`
  })

  const description = computed(() => toValue(options.description) ?? '')
  const noindex = computed(() => Boolean(toValue(options.noindex)))

  const imageUrl = computed(() => {
    const img = toValue(options.image) || defaultOgImage(currentLocale.value)
    return img.startsWith('http') ? img : absoluteUrl(img)
  })

  useHead(computed(() => {
    const loc = currentLocale.value

    // Une balise alternate par langue + `x-default` pour les visiteurs dont la
    // langue n'est pas couverte. Google exige que chaque page se cite elle-même.
    //
    // Le type de unhead pour `rel: 'alternate'` vise le cas des flux RSS et
    // réclame un `type` ; les alternates de langue n'en ont pas, d'où le cast.
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
          // `max-image-preview:large` autorise la grande vignette dans les résultats,
          // décisif sur un catalogue où la couverture fait le clic.
          content: noindex.value
            ? 'noindex, nofollow'
            : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        },

        // Open Graph — aperçu sur Discord, WhatsApp, Facebook, LinkedIn
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

        // Twitter/X — `summary_large_image` donne la carte pleine largeur
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: fullTitle.value },
        { name: 'twitter:description', content: description.value },
        { name: 'twitter:image', content: imageUrl.value },
        ...(TWITTER_HANDLE ? [{ name: 'twitter:site', content: TWITTER_HANDLE }] : []),
      ],
      script: jsonLd.map((block, i) => ({
        // `key` stable : sans ça unhead accumulerait les blocs à chaque navigation
        key: `ld-${i}`,
        type: 'application/ld+json',
        ...(cspNonce ? { nonce: cspNonce } : {}),
        innerHTML: JSON.stringify(block),
      })),
    }
  }))

  return { canonicalUrl, canonicalPath, currentLocale }
}

export { SITE_URL, SITE_NAME }
