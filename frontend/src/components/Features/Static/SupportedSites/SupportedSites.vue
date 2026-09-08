<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-3xl mx-auto px-6">
      <div class="text-center mb-12">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('static.supported_sites.label') }}
        </span>
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          {{ $t('static.supported_sites.title') }}
        </h1>
        <p class="text-gray-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {{ $t('static.supported_sites.desc') }}
        </p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div
          v-for="site in sites"
          :key="site"
          class="p-5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900 text-center font-semibold text-gray-700 dark:text-zinc-200"
        >
          {{ site }}
        </div>
      </div>

      <p class="text-center text-gray-600 dark:text-zinc-400 text-sm mt-8">
        {{ $t('static.supported_sites.more_soon') }}
      </p>
    </div>
  </section>
</template>

<script src="./SupportedSites.ts"></script>
