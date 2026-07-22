<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-3xl mx-auto px-6 text-center">
      <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
        {{ $t('static.blog.label') }}
      </span>
      <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
        {{ $t('static.blog.title') }}
      </h1>
      <p class="text-gray-500 dark:text-zinc-400 leading-relaxed">
        {{ $t('static.blog.empty') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import Menu from '../../Shared/Menu/Menu.vue'
</script>
