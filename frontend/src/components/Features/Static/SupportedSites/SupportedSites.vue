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
        <component
          v-for="site in sites"
          :is="site.url ? 'a' : 'div'"
          :key="site.name"
          :href="site.url || undefined"
          :rel="site.url ? 'noopener nofollow' : undefined"
          target="_blank"
          class="p-5 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900 text-center text-gray-700 dark:text-zinc-200 block"
          :class="site.url ? 'hover:border-violet-300 dark:hover:border-violet-700 transition' : ''"
        >
          <span class="font-semibold block">{{ site.name }}</span>
          <span v-if="site.description" class="text-xs text-gray-600 dark:text-zinc-300 block mt-1">{{ site.description }}</span>
        </component>
      </div>

      <p class="text-center text-gray-600 dark:text-zinc-400 text-sm mt-8">
        {{ $t('static.supported_sites.more_soon') }}
      </p>
    </div>
  </section>
</template>

<script src="./SupportedSites.ts"></script>
