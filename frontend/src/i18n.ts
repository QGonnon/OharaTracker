import { createI18n } from 'vue-i18n'
import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from './seo/config'

export type SupportedLocale = Locale
export const SUPPORTED = LOCALES

/**
 * Langue à utiliser quand l'URL n'en impose pas (racine du site, première visite).
 * L'URL reste prioritaire : c'est le router qui appelle `setLocale` à chaque
 * navigation, pour qu'une page `/de/...` soit toujours servie en allemand,
 * quelle que soit la préférence enregistrée.
 */
export function detectPreferredLocale(): SupportedLocale {
  // 1. Choix explicite de l'utilisateur
  try {
    const saved = localStorage.getItem('lang')
    if (isLocale(saved)) return saved
  } catch { /* localStorage indisponible (navigation privée, cookies bloqués) */ }

  // 2. Langues du navigateur/OS, du plus précis au plus général
  const browserLangs = typeof navigator !== 'undefined' && navigator.languages?.length
    ? navigator.languages
    : typeof navigator !== 'undefined' ? [navigator.language] : []

  for (const lang of browserLangs) {
    const short = lang?.toLowerCase().split('-')[0]
    if (isLocale(short)) return short
  }

  return DEFAULT_LOCALE
}

/**
 * Fichiers de traduction, chargés à la demande.
 *
 * Les cinq langues étaient importées statiquement : 144 Ko de JSON se
 * retrouvaient dans le bundle initial alors qu'un visiteur n'en lit qu'une.
 * `import.meta.glob` laisse Vite en faire des chunks séparés, téléchargés
 * uniquement quand la langue est réellement demandée.
 */
const messageLoaders = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json')

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  // Démarre sans messages : `loadLocaleMessages` les injecte avant le montage.
  messages: {},
})

/** Langues déjà téléchargées, pour ne pas refaire la requête à chaque bascule. */
const loaded = new Set<SupportedLocale>()

/** Télécharge et enregistre les messages d'une langue. Idempotent. */
export async function loadLocaleMessages(locale: SupportedLocale): Promise<void> {
  if (loaded.has(locale)) return

  const loader = messageLoaders[`./locales/${locale}.json`]
  if (!loader) return

  const module = await loader()
  i18n.global.setLocaleMessage(locale, module.default as never)
  loaded.add(locale)
}

/**
 * Change la langue active et la mémorise pour les prochaines visites.
 *
 * Asynchrone parce que les messages peuvent ne pas être encore téléchargés ;
 * la langue n'est appliquée qu'une fois ceux-ci disponibles, pour ne jamais
 * afficher de clés de traduction brutes pendant le chargement.
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  await loadLocaleMessages(locale)
  if (i18n.global.locale.value !== locale) {
    i18n.global.locale.value = locale
  }
  try {
    localStorage.setItem('lang', locale)
  } catch { /* ignore */ }
}

export default i18n
