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
        Ohara Tracker
      </h1>

      <Menubar
        :model="menuItems"
        class="border-none bg-transparent shadow-none"
      />
    </nav>
  </header>
</template>

<script lang="ts" src="./Menu.ts"></script>
<link rel="stylesheet" href="Menu.css">