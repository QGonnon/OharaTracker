import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Button, Drawer } from 'primevue'
import PopupMenu from 'primevue/menu'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../../store/auth.module'
import { useI18n } from 'vue-i18n'
import type { MenuItem } from 'primevue/menuitem'

type SupportedLocale = 'fr' | 'en' | 'de' | 'it' | 'es'

const LANGUAGES: { code: SupportedLocale; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English'  },
  { code: 'de', label: 'Deutsch'  },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español'  },
]

export default defineComponent({
  name: 'AppMenu',
  components: { Button, Drawer, PopupMenu },
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

    onMounted(() => document.addEventListener('mousedown', handleClickOutside))
    onBeforeUnmount(() => document.removeEventListener('mousedown', handleClickOutside))

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const name = computed(() => authStore.currentUser?.name || '')

    const goLogin = () => router.push({ name: 'Login' })

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
    const currentLocale = computed({
      get: () => locale.value as SupportedLocale,
      set: (val: SupportedLocale) => {
        locale.value = val
        try { localStorage.setItem('lang', val) } catch (e) {}
      },
    })

    const currentLang = computed(
      () => LANGUAGES.find(l => l.code === currentLocale.value) ?? LANGUAGES[0]
    )

    const currentCode = computed(() => currentLang.value.code.toUpperCase())

    const selectLang = (code: SupportedLocale) => {
      currentLocale.value = code
      langDropdownOpen.value = false
    }

    const isActive = (name: string) => route.name === name

    const navLinks = computed(() => [
      { label: t('nav.discovery'), name: 'Découverte', to: '/discovery', icon: 'pi pi-compass' },
      { label: t('nav.library'),   name: 'Search',     to: '/search',    icon: 'pi pi-book' },
      { label: t('nav.following'), name: 'Mes Suivis', to: '/list',      icon: 'pi pi-star' },
    ])

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
      selectLang,
      isActive,
      navLinks,
      toggleUserMenu,
      userMenuItems,
    }
  },
})
