// Générateurs de données structurées schema.org.
//
// Chaque bloc est un objet JSON-LD prêt à être injecté par `useSeo`. Les `@id`
// sont stables et absolus pour que Google relie entre elles les entités décrites
// sur des pages différentes (l'Organization citée par une œuvre est la même que
// celle décrite sur l'accueil).

import {
  SITE_NAME, SITE_URL, SOCIAL_PROFILES, absoluteUrl, homePath, pagePath,
  type Locale, type MediaKind,
} from './config'

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`

/** L'éditeur du site. Référencé par `@id` partout ailleurs plutôt que redupliqué. */
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

/**
 * Le site lui-même, avec le `SearchAction` qui rend éligible à la « sitelinks
 * search box » : une barre de recherche Ohara Tracker directement dans Google.
 */
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

/**
 * L'application elle-même. `WebApplication` + offre gratuite permet d'apparaître
 * sur les requêtes « application de suivi manga » avec le prix affiché.
 */
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

/**
 * Fil d'Ariane. Google l'affiche à la place de l'URL brute dans les résultats,
 * ce qui améliore nettement le taux de clic sur les pages profondes.
 */
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

/** Type schema.org le plus précis pour chaque nature d'œuvre du catalogue. */
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
  /** Thèmes/genres, tels que stockés en base (chaîne séparée par des virgules). */
  theme?: string
  image?: string
  url: string
  locale: Locale
  status?: string
  totalEpisodes?: number
  totalSeasons?: number
  /** Note moyenne sur 10 et nombre de votes — omis si l'œuvre n'est pas encore notée. */
  ratingValue?: number | null
  ratingCount?: number | null
}

/**
 * Une œuvre du catalogue. C'est le bloc qui compte le plus : il permet à Google
 * de comprendre que la page décrit une série précise et de la rattacher à
 * l'entité correspondante du Knowledge Graph.
 */
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

  // `aggregateRating` sans note réelle est une violation des règles Google
  // (rich result trompeur) : on ne l'émet que si la note existe vraiment.
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

/** Page de listing (découverte, résultats) : décrit la collection et ses éléments. */
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

/** FAQ : éligible au rich result « questions dépliables » sous le résultat. */
export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
})

/** Offres payantes de la page tarifs, avec prix affichés dans les résultats. */
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
