<template>
  <header class="layout-topbar">
    <nav class="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 sm:px-6"
         :aria-label="$t('nav.main')">

      <!--
        Le logo était un titre de niveau 1. Comme ce menu est monté en tête de
        chaque page, chaque page en avait deux, le premier étant le nom du site :
        la navigation par titres remontait la marque au lieu du sujet de la page.
      -->
      <div class="topbar-logo text-2xl font-bold">
        <RouterLink :to="homeLink" class="hover:opacity-80 transition-opacity">Ohara Tracker</RouterLink>
      </div>

      <!-- Desktop nav links -->
      <div class="hidden md:flex items-center gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.to"
          :aria-current="isActive(link.name) ? 'page' : undefined"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
            isActive(link.name)
              ? 'nav-link--active'
              : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
          ]"
        >
          {{ link.label }}
        </RouterLink>
      </div>

      <!-- Right side actions -->
      <div class="flex items-center gap-2">

        <!-- Language dropdown -->
        <div class="nav-lang-wrapper" ref="langDropdownRef">
          <!--
            L'état ouvert/fermé n'était signalé que par la rotation du chevron,
            donc invisible pour un lecteur d'écran : `aria-expanded` le porte.
          -->
          <button
            type="button"
            class="nav-lang-trigger"
            :aria-label="`${$t('nav.language')} : ${currentLang.label}`"
            aria-haspopup="listbox"
            :aria-expanded="langDropdownOpen"
            aria-controls="lang-dropdown"
            @click="langDropdownOpen = !langDropdownOpen"
          >
            <span class="nav-lang-code" aria-hidden="true">{{ currentCode }}</span>
            <i aria-hidden="true"
               :class="['pi pi-chevron-down nav-lang-chevron', { 'nav-lang-chevron--open': langDropdownOpen }]" />
          </button>

          <Transition name="lang-drop">
            <ul v-if="langDropdownOpen" id="lang-dropdown" class="nav-lang-dropdown">
              <!--
                De vrais <a href> plutôt que des boutons : le sélecteur de langue
                devient un lien que les moteurs peuvent suivre vers la version
                traduite, ce qui renforce les balises hreflang du <head>.
              -->
              <li
                v-for="lang in languageLinks"
                :key="lang.code"
                :class="['nav-lang-option', { 'nav-lang-option--active': lang.code === currentLocale }]"
              >
                <RouterLink
                  :to="lang.to"
                  :hreflang="lang.code"
                  :lang="lang.code"
                  :aria-current="lang.code === currentLocale ? 'true' : undefined"
                  class="nav-lang-option-link"
                  @click="langDropdownOpen = false"
                >
                  <span class="nav-lang-option-label">{{ lang.label }}</span>
                  <!-- L'état sélectionné est déjà porté par `aria-current` -->
                  <i v-if="lang.code === currentLocale" aria-hidden="true" class="pi pi-check nav-lang-option-check" />
                </RouterLink>
              </li>
            </ul>
          </Transition>
        </div>

        <!--
          `title` seul ne constitue pas un nom accessible fiable (inaccessible au
          tactile) et ne dit rien de l'état courant : `aria-label` + `aria-pressed`.
        -->
        <button
          type="button"
          class="nav-theme-toggle"
          :aria-label="theme === 'dark' ? $t('nav.theme_light') : $t('nav.theme_dark')"
          :aria-pressed="theme === 'dark'"
          @click="toggleTheme"
        >
          <font-awesome-icon aria-hidden="true"
            :icon="theme === 'dark' ? ['fas', 'sun'] : ['fas', 'moon']" class="text-sm" />
        </button>

        <!-- Notifications -->
        <NotificationBell v-if="isLoggedIn" />

        <!-- Login button (desktop only) -->
        <Button
          v-if="!isLoggedIn"
          :label="$t('nav.login')"
          outlined
          size="small"
          class="hidden md:block font-semibold"
          @click="goLogin"
        />

        <!-- User avatar + popup (desktop only) -->
        <div v-if="isLoggedIn" class="hidden md:block">
          <!--
            `aria-label` explicite : le seul texte du bouton est le pseudo, et
            celui-ci est vide tant que le profil n'est pas chargé (ou si le compte
            n'a pas de nom). Le bouton était alors annoncé « bouton », sans plus.
          -->
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 nav-user-trigger"
            :aria-label="name ? `${$t('nav.user_menu')} : ${name}` : $t('nav.user_menu')"
            aria-haspopup="true"
            aria-controls="user-menu"
            @click="toggleUserMenu"
          >
            <!-- L'initiale doublonne le pseudo juste à côté : annoncée seule, ce
                 serait une lettre isolée sans signification. -->
            <div aria-hidden="true"
              class="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold select-none">
              {{ name[0]?.toUpperCase() }}
            </div>
            <span class="text-sm font-semibold text-gray-700 dark:text-zinc-200 max-w-[8rem] truncate">
              {{ name }}
            </span>
            <i aria-hidden="true" class="pi pi-chevron-down text-[10px] text-gray-600 dark:text-zinc-400" />
          </button>
          <PopupMenu id="user-menu" ref="userMenuRef" :model="userMenuItems" popup />
        </div>

        <!--
          Seul accès à la navigation sur mobile. Il n'avait aucun nom accessible :
          l'icône PrimeIcons est un glyphe en zone privée Unicode, donc invisible
          pour un lecteur d'écran.
        -->
        <button
          type="button"
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-zinc-400 transition-colors"
          :aria-label="$t('nav.open_menu')"
          aria-haspopup="dialog"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-drawer"
          @click="mobileOpen = true"
        >
          <i class="pi pi-bars text-lg" aria-hidden="true" />
        </button>

      </div>
    </nav>
  </header>

  <!--
    PrimeVue pose déjà `role="dialog"`, le piège de focus et la fermeture par
    Échap, mais aucun nom : le dialogue était annoncé sans titre.
  -->
  <Drawer
    id="mobile-drawer"
    v-model:visible="mobileOpen"
    position="right"
    class="mobile-drawer"
    :aria-label="$t('nav.navigation')"
  >
    <template #header>
      <span class="text-base font-bold text-gray-900 dark:text-white">{{ $t('nav.navigation') }}</span>
    </template>

    <div class="flex flex-col h-full">

      <!-- Nav links -->
      <nav class="flex flex-col gap-1 p-2" :aria-label="$t('nav.main')">
        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.to"
          :aria-current="isActive(link.name) ? 'page' : undefined"
          @click="mobileOpen = false"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
            isActive(link.name)
              ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
              : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5'
          ]"
        >
          <i :class="link.icon" aria-hidden="true" />
          {{ link.label }}
        </RouterLink>
      </nav>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- User section at bottom -->
      <div class="p-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">

        <!-- Language (mobile) -->
        <div class="nav-lang-mobile">
          <span id="lang-mobile-label" class="nav-lang-mobile-label">
            <i class="pi pi-globe" aria-hidden="true" /> {{ $t('nav.language') }}
          </span>
          <!-- Groupe de bascules : l'état actif n'était signalé que par la couleur. -->
          <div class="nav-lang-mobile-options" role="group" aria-labelledby="lang-mobile-label">
            <button
              v-for="lang in languages"
              :key="lang.code"
              type="button"
              :lang="lang.code"
              :aria-label="lang.label"
              :aria-pressed="lang.code === currentLocale"
              :class="['nav-lang-mobile-btn', { 'nav-lang-mobile-btn--active': lang.code === currentLocale }]"
              @click="selectLang(lang.code)"
            >
              {{ lang.code.toUpperCase() }}
            </button>
          </div>
        </div>

        <template v-if="isLoggedIn">
          <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 mb-1">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm select-none">
              {{ name[0]?.toUpperCase() || '?' }}
            </div>
            <span class="font-semibold text-gray-800 dark:text-white truncate">{{ name }}</span>
          </div>
          <RouterLink :to="profileLink" @click="mobileOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium">
            <i class="pi pi-user text-gray-600"  aria-hidden="true"/> {{ $t('nav.profile') }}
          </RouterLink>
          <RouterLink :to="libraryLink" @click="mobileOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium">
            <i class="pi pi-bookmark text-gray-600"  aria-hidden="true"/> {{ $t('nav.following') }}
          </RouterLink>
          <RouterLink :to="notificationsLink" @click="mobileOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium">
            <i class="pi pi-bell text-gray-600"  aria-hidden="true"/> {{ $t('notifications.title') }}
          </RouterLink>
          <button
            @click="handleLogout(); mobileOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium w-full text-left"
          >
            <i class="pi pi-sign-out"  aria-hidden="true"/> {{ $t('nav.logout') }}
          </button>
        </template>

        <template v-else>
          <Button :label="$t('nav.login')" class="w-full font-semibold" @click="goLogin(); mobileOpen = false" />
        </template>

      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import component from './Menu.ts'
export default component
</script>

<style src="./Menu.css"></style>
