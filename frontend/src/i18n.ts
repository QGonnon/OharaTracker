import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

const savedLocale = (() => {
  try { return localStorage.getItem('lang') || 'fr' } catch { return 'fr' }
})()

export default createI18n({
  legacy: false,
  globalInjection: true,
  locale: savedLocale as 'fr' | 'en',
  fallbackLocale: 'en',
  messages: { fr, en },
})
