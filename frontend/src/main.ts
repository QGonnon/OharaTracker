import './assets/tailwind.css'
import './assets/styles.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'  // même package

import App from './App.vue'
import router from './router'
import { FontAwesomeIcon } from './plugins/font-awesome.ts'
import i18n from './i18n'
import { useNotificationStore } from './store/notification.module'
import { setupHttpInterceptors } from './services/http-interceptors'

const pinia = createPinia()

const OharaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '{violet.50}',
      100: '{violet.100}',
      200: '{violet.200}',
      300: '{violet.300}',
      400: '{violet.400}',
      500: '{violet.500}',
      600: '{violet.600}',
      700: '{violet.700}',
      800: '{violet.800}',
      900: '{violet.900}',
      950: '{violet.950}',
    }
  }
})

const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: OharaPreset,
        options: {
            darkModeSelector: '.dark-theme',
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue'
            }
        }
    }
})

app.use(router)
    .use(pinia)
    .use(i18n)
    .component('font-awesome-icon', FontAwesomeIcon)
    .directive('tooltip', Tooltip)

setupHttpInterceptors(pinia, router)

try {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme')
    } else {
        document.documentElement.classList.remove('dark-theme')
    }
} catch (e) {}

app.mount('#app')

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Erreur lors de l\'enregistrement du service worker:', err)
    })
    useNotificationStore(pinia).listenForServiceWorkerMessages()
}