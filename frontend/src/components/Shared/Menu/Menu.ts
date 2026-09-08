import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import PopupMenu from 'primevue/menu'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../store/auth.module'
import { useI18n } from 'vue-i18n'
import type { MenuItem } from 'primevue/menuitem'
import NotificationBell from '../NotificationBell/NotificationBell.vue'
import { localeHome, localePath, switchLocalePath } from '../../../seo/localePath'
import type { Locale } from '../../../seo/config'

type SupportedLocale = Locale

const LANGUAGES: { code: SupportedLocale; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English'  },
  { code: 'de', label: 'Deutsch'  },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español'  },
]

export default defineComponent({
  name: 'AppMenu',
  components: { Button, Drawer, PopupMenu, NotificationBell },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const { t, locale } = useI18n()

    const mobileOpen = ref(false)
    const userMenuRef = ref()
    const langDropdownOpen = ref(false)
    const langDropdownRef = ref<HTMLElement | null>(null)

    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.value && !langDropdownRef.value.contains(e.target as Node)) {
        langDropdownOpen.value = false
      }
    }

    /**
     * Le menu ne se fermait qu'au clic extérieur : un utilisateur au clavier
     * n'avait aucun moyen d'en sortir sans le traverser entièrement.
     * Le focus retourne sur le déclencheur, sinon il repartirait en haut de page.
     */
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !langDropdownOpen.value) return
      langDropdownOpen.value = false
      langDropdownRef.value?.querySelector<HTMLElement>('.nav-lang-trigger')?.focus()
    }

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    })

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const name = computed(() => authStore.currentUser?.name || '')

    const goLogin = () => router.push({ 
      name: 'Login', 
      query: { redirect: route.fullPath } 
    })
    
    const handleLogout = () => {
      authStore.logout()
      router.push({ name: 'Login' })
    }

    // Theme
    const theme = ref(document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light')
    const toggleTheme = () => {
      if (theme.value === 'dark') {
        theme.value = 'light'
        document.documentElement.classList.remove('dark-theme')
        try { localStorage.setItem('theme', 'light') } catch (e) {}
      } else {
        theme.value = 'dark'
        document.documentElement.classList.add('dark-theme')
        try { localStorage.setItem('theme', 'dark') } catch (e) {}
      }
    }

    // Language
    const currentLocale = computed(() => locale.value as SupportedLocale)

    const currentLang = computed(
      () => LANGUAGES.find(l => l.code === currentLocale.value) ?? LANGUAGES[0]
    )

    const currentCode = computed(() => currentLang.value.code.toUpperCase())

    /**
     * Changer de langue = changer d'URL. Le router applique ensuite la nouvelle
     * langue (et la mémorise), donc l'URL, le contenu et le `<html lang>` restent
     * toujours cohérents — condition nécessaire pour que les hreflang soient valides.
     */
    const selectLang = (code: SupportedLocale) => {
      langDropdownOpen.value = false
      router.push({ path: switchLocalePath(route, code), query: route.query })
    }

    /** Les alternatives de langue rendues en vrais `<a href>`, pour être crawlables. */
    const languageLinks = computed(() =>
      LANGUAGES.map(lang => ({ ...lang, to: switchLocalePath(route, lang.code) }))
    )

    const isActive = (name: string) => route.name === name

    const homeLink = computed(() => localeHome())

    const navLinks = computed(() => [
      { label: t('nav.library'),   name: 'Search',    to: localePath('search'),    icon: 'pi pi-book' },
      { label: t('nav.discovery'), name: 'Discovery', to: localePath('discovery'), icon: 'pi pi-compass' },
      { label: t('nav.following'), name: 'Library',   to: localePath('library'),   icon: 'pi pi-star' },
    ])

    const profileLink = computed(() => localePath('profile'))
    const libraryLink = computed(() => localePath('library'))
    const notificationsLink = computed(() => localePath('notifications'))

    const toggleUserMenu = (event: Event) => {
      userMenuRef.value?.toggle(event)
    }

    const userMenuItems = computed<MenuItem[]>(() => [
      { label: t('nav.profile'), icon: 'pi pi-user',     command: () => router.push({ name: 'Profile' }) },
      { separator: true },
      { label: t('nav.logout'),  icon: 'pi pi-sign-out', command: handleLogout },
    ])

    return {
      mobileOpen,
      userMenuRef,
      langDropdownOpen,
      langDropdownRef,
      isLoggedIn,
      name,
      goLogin,
      handleLogout,
      theme,
      toggleTheme,
      currentLocale,
      currentLang,
      currentCode,
      languages: LANGUAGES,
      languageLinks,
      selectLang,
      isActive,
      navLinks,
      homeLink,
      profileLink,
      libraryLink,
      notificationsLink,
      toggleUserMenu,
      userMenuItems,
    }
  },
})
