// Générateurs de données structurées schema.org, injectées par useSeo.
// Les @id sont stables et absolus pour que Google relie les mêmes entités entre pages.

import {
  SITE_NAME, SITE_URL, SOCIAL_PROFILES, absoluteUrl, homePath, pagePath,
  type Locale, type MediaKind,
} from './config'

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`

// Référencé par @id ailleurs plutôt que redupliqué.
export const organizationJsonLd = (locale: Locale, description: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: absoluteUrl(homePath(locale)),
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl('/pwa-512.png'),
    width: 512,
    height: 512,
  },
  description,
  sameAs: SOCIAL_PROFILES,
})

// SearchAction rend éligible à la sitelinks search box dans les résultats Google.
export const websiteJsonLd = (locale: Locale, searchPath: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: SITE_NAME,
  url: absoluteUrl(homePath(locale)),
  inLanguage: locale,
  publisher: { '@id': ORG_ID },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${absoluteUrl(searchPath)}?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
})

// WebApplication + offre gratuite : apparaît avec le prix affiché sur les requêtes pertinentes.
export const webApplicationJsonLd = (locale: Locale, description: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: absoluteUrl(homePath(locale)),
  description,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'Web, Android, iOS',
  browserRequirements: 'Requires JavaScript',
  inLanguage: ['fr', 'en', 'de', 'it', 'es'],
  publisher: { '@id': ORG_ID },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
  },
})

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

const SCHEMA_TYPE: Record<MediaKind, string> = {
  lecture: 'ComicSeries',
  serie: 'TVSeries',
  film: 'Movie',
}

export interface MediaJsonLdInput {
  title: string
  kind: MediaKind
  description?: string
  author?: string
  artist?: string
  theme?: string
  image?: string
  url: string
  locale: Locale
  status?: string
  totalEpisodes?: number
  totalSeasons?: number
  ratingValue?: number | null
  ratingCount?: number | null
}

export const mediaJsonLd = (input: MediaJsonLdInput) => {
  const genres = (input.theme ?? '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  const people = [input.author, input.artist]
    .filter((name): name is string => Boolean(name?.trim()))
    .map(name => ({ '@type': 'Person', name: name.trim() }))

  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[input.kind],
    name: input.title,
    url: input.url,
    inLanguage: input.locale,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(genres.length ? { genre: genres } : {}),
    ...(people.length ? { author: people } : {}),
  }

  // Une série TV décrit ses saisons/épisodes ; une bande dessinée n'a pas ces champs.
  if (input.kind === 'serie') {
    if (input.totalEpisodes) base.numberOfEpisodes = input.totalEpisodes
    if (input.totalSeasons) base.numberOfSeasons = input.totalSeasons
  }

  // aggregateRating sans note réelle est un rich result trompeur, sanctionné par Google.
  if (input.ratingValue && input.ratingCount && input.ratingCount > 0) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.ratingValue,
      ratingCount: input.ratingCount,
      bestRating: 10,
      worstRating: 1,
    }
  }

  return base
}

export const collectionJsonLd = (input: {
  name: string
  description: string
  url: string
  locale: Locale
  items: { name: string; url: string }[]
}) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: input.name,
  description: input.description,
  url: input.url,
  inLanguage: input.locale,
  isPartOf: { '@id': SITE_ID },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  },
})

export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
})

export const pricingJsonLd = (input: {
  locale: Locale
  description: string
  offers: { name: string; price: string; currency: string; description?: string }[]
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: `${SITE_NAME} Premium`,
  description: input.description,
  brand: { '@id': ORG_ID },
  url: absoluteUrl(pagePath('pricing', input.locale)),
  offers: input.offers.map(offer => ({
    '@type': 'Offer',
    name: offer.name,
    price: offer.price,
    priceCurrency: offer.currency,
    availability: 'https://schema.org/InStock',
    url: absoluteUrl(pagePath('pricing', input.locale)),
    ...(offer.description ? { description: offer.description } : {}),
  })),
})
