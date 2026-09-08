import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'
import de from './locales/de.json'
import it from './locales/it.json'
import es from './locales/es.json'
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

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectPreferredLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { fr, en, de, it, es },
})

/** Change la langue active et la mémorise pour les prochaines visites. */
export function setLocale(locale: SupportedLocale) {
  if (i18n.global.locale.value === locale) return
  i18n.global.locale.value = locale
  try {
    localStorage.setItem('lang', locale)
  } catch { /* ignore */ }
}

export default i18n
