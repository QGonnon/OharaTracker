<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-2xl mx-auto px-6 text-center">
      <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
        {{ $t('static.suggestions.label') }}
      </span>
      <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
        {{ $t('static.suggestions.title') }}
      </h1>
      <p class="text-gray-500 dark:text-zinc-400 leading-relaxed mb-8">
        {{ $t('static.suggestions.desc') }}
      </p>
      <Button asChild v-slot="slotProps" class="font-semibold">
        <a :href="DISCORD_URL" target="_blank" rel="noopener noreferrer" :class="slotProps.class">
          {{ $t('static.suggestions.cta') }}
          <span class="sr-only">({{ $t('common.opens_new_tab') }})</span>
        </a>
      </Button>
    </div>
  </section>
</template>

<script src="./Suggestions.ts"></script>
