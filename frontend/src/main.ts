import './assets/tailwind.css'
import './assets/styles.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import App from './App.vue'
import router from './router'
import { FontAwesomeIcon } from './plugins/font-awesome.ts'

const pinia = createPinia()

const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options:{
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
    .component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')
