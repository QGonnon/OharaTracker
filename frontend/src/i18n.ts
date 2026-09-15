import { createI18n } from 'vue-i18n'
import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from './seo/config'

export type SupportedLocale = Locale
export const SUPPORTED = LOCALES

// Utilisée quand l'URL n'impose pas de langue ; l'URL reste sinon toujours prioritaire.
export function detectPreferredLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem('lang')
    if (isLocale(saved)) return saved
  } catch { /* localStorage indisponible (navigation privée, cookies bloqués) */ }

  const browserLangs = typeof navigator !== 'undefined' && navigator.languages?.length
    ? navigator.languages
    : typeof navigator !== 'undefined' ? [navigator.language] : []

  for (const lang of browserLangs) {
    const short = lang?.toLowerCase().split('-')[0]
    if (isLocale(short)) return short
  }

  return DEFAULT_LOCALE
}

// import.meta.glob laisse Vite chunker les traductions par langue, au lieu de tout
// bundler statiquement (144 Ko de JSON alors qu'un visiteur n'en lit qu'une langue).
const messageLoaders = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json')

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
})

const loaded = new Set<SupportedLocale>()

// Idempotent.
export async function loadLocaleMessages(locale: SupportedLocale): Promise<void> {
  if (loaded.has(locale)) return

  const loader = messageLoaders[`./locales/${locale}.json`]
  if (!loader) return

  const module = await loader()
  i18n.global.setLocaleMessage(locale, module.default as never)
  loaded.add(locale)
}

// Asynchrone : la langue n'est appliquée qu'une fois ses messages téléchargés,
// pour ne jamais afficher de clés de traduction brutes pendant le chargement.
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
