<template>
  <header :class="['layout-topbar', isShrunk ? 'shadow-md py-2' : 'py-3']">
    <nav class="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6">

      <!-- Logo -->
      <h1 :class="['font-bold transition-all duration-300', isShrunk ? 'text-xl' : 'text-2xl']">
        <RouterLink to="/" class="hover:opacity-80 transition-opacity">Ohara Tracker</RouterLink>
      </h1>

      <!-- Desktop nav links -->
      <div class="hidden md:flex items-center gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.to"
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

        <!-- Theme toggle -->
        <button
          class="nav-theme-toggle"
          @click="toggleTheme"
          :title="theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'"
        >
          <font-awesome-icon :icon="theme === 'dark' ? ['fas', 'sun'] : ['fas', 'moon']" class="text-sm" />
        </button>

        <!-- Login button (desktop only) -->
        <RouterLink v-if="!isLoggedIn" to="/login" class="hidden md:block">
          <Button label="Se connecter" outlined size="small" class="font-semibold" @click="goLogin" />
        </RouterLink>

        <!-- User avatar + popup (desktop only) -->
        <div v-if="isLoggedIn" class="hidden md:block">
          <button
            class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200"
            @click="toggleUserMenu"
          >
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold select-none">
              {{ displayName[0]?.toUpperCase() || '?' }}
            </div>
            <span class="text-sm font-semibold text-gray-700 dark:text-zinc-200 max-w-[8rem] truncate">
              {{ displayName }}
            </span>
            <i class="pi pi-chevron-down text-[10px] text-gray-400" />
          </button>
          <PopupMenu ref="userMenuRef" :model="userMenuItems" popup />
        </div>

        <!-- Hamburger (mobile only) -->
        <button
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-zinc-400 transition-colors"
          @click="mobileOpen = true"
        >
          <i class="pi pi-bars text-lg" />
        </button>

      </div>
    </nav>
  </header>

  <!-- Mobile Drawer -->
  <Drawer v-model:visible="mobileOpen" position="right" class="mobile-drawer">
    <template #header>
      <span class="text-base font-bold text-gray-900 dark:text-white">Navigation</span>
    </template>

    <div class="flex flex-col h-full">

      <!-- Nav links -->
      <div class="flex flex-col gap-1 p-2">
        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.to"
          @click="mobileOpen = false"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
            isActive(link.name)
              ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
              : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5'
          ]"
        >
          <i :class="link.icon" />
          {{ link.label }}
        </RouterLink>
      </div>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- User section at bottom -->
      <div class="p-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">

        <template v-if="isLoggedIn">
          <!-- User info -->
          <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 mb-1">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm select-none">
              {{ displayName[0]?.toUpperCase() || '?' }}
            </div>
            <span class="font-semibold text-gray-800 dark:text-white truncate">{{ displayName }}</span>
          </div>
          <RouterLink to="/profile" @click="mobileOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium">
            <i class="pi pi-user text-gray-400" /> Mon profil
          </RouterLink>
          <RouterLink to="/list" @click="mobileOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium">
            <i class="pi pi-bookmark text-gray-400" /> Mes suivis
          </RouterLink>
          <button
            @click="handleLogout(); mobileOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium w-full text-left"
          >
            <i class="pi pi-sign-out" /> Se déconnecter
          </button>
        </template>

        <template v-else>
          <Button label="Se connecter" class="w-full font-semibold" @click="goLogin(); mobileOpen = false" />
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
