<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-2xl mx-auto px-6">
      <div class="text-center mb-12">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('static.changelog.label') }}
        </span>
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white">
          {{ $t('static.changelog.title') }}
        </h1>
      </div>

      <ol class="relative border-l border-gray-200 dark:border-white/10 space-y-10 ml-2">
        <li v-for="entry in entries" :key="entry.version" class="ml-6">
          <span class="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-violet-600 border-2 border-white dark:border-zinc-950" />
          <div class="flex items-center gap-3 mb-1">
            <span class="font-bold text-gray-900 dark:text-white">{{ entry.version }}</span>
            <span class="text-xs text-gray-600 dark:text-zinc-400">{{ entry.date }}</span>
          </div>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">{{ $t(entry.key) }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script src="./Changelog.ts"></script>
