<template>
  <header
    :class="[
      'layout-topbar',
      { 'shadow-md py-2': isShrunk, 'py-4': !isShrunk }
    ]"
  >
    <nav
      class="max-w-7xl mx-auto flex justify-between items-center px-6 transition-all duration-300"
    >
      <h1
        :class="[
          'font-bold transition-all duration-300',
          isShrunk ? 'text-xl' : 'text-2xl'
        ]"
      >
        <router-link to="/" class="hover:opacity-80 transition-opacity">
          Ohara Tracker
        </router-link>
      </h1>

      <div class="flex items-center gap-4">
        <Menubar
          :model="menuItems"
          class="border-none bg-transparent shadow-none"
        />

        <button
          v-if="isLoggedIn"
          class="nav-theme-toggle p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          @click="toggleTheme"
          :title="theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'"
        >
          <font-awesome-icon :icon="theme === 'dark' ? ['fas','sun'] : ['fas','moon']" />
        </button>

        <button
          v-if="!isLoggedIn"
          class="nav-login"
          @click="goLogin"
        >
          Se connecter
        </button>
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import component from './Menu.ts'
export default component
</script>
<link rel="stylesheet" href="Menu.css">
