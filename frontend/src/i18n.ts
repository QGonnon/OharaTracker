import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'
import de from './locales/de.json'
import it from './locales/it.json'
import es from './locales/es.json'

type SupportedLocale = 'fr' | 'en' | 'de' | 'it' | 'es'
const SUPPORTED: SupportedLocale[] = ['fr', 'en', 'de', 'it', 'es']

function detectLocale(): SupportedLocale {
  // 1. Preference saved by user
  try {
    const saved = localStorage.getItem('lang') as SupportedLocale | null
    if (saved && SUPPORTED.includes(saved)) return saved
  } catch { /* ignore */ }

  // 2. Browser/OS language list
  const browserLangs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]

  for (const lang of browserLangs) {
    // match full tag first ('fr-FR' → 'fr'), then short code
    const short = lang.toLowerCase().split('-')[0] as SupportedLocale
    if (SUPPORTED.includes(short)) return short
  }

  return 'en'
}

export default createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { fr, en, de, it, es },
})
