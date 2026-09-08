<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-3xl mx-auto px-6">
      <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
        {{ $t('legal.privacy.title') }}
      </h1>
      <p class="text-sm text-gray-600 dark:text-zinc-400 mb-10">{{ $t('legal.last_updated') }}</p>

      <div class="space-y-8">
        <div v-for="(section, i) in sections" :key="i">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ $t(section.title) }}</h2>
          <p class="text-gray-500 dark:text-zinc-400 leading-relaxed">{{ $t(section.text) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script src="./Privacy.ts"></script>
