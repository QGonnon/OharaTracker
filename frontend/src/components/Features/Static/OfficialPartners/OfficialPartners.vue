<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-3xl mx-auto px-6">
      <div class="text-center mb-12">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('static.official_partners.label') }}
        </span>
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          {{ $t('static.official_partners.title') }}
        </h1>
        <p class="text-gray-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {{ $t('static.official_partners.desc') }}
        </p>
      </div>

      <p class="text-center text-gray-600 dark:text-zinc-400 text-sm">
        {{ $t('static.official_partners.empty') }}
      </p>
    </div>
  </section>
</template>

<script src="./OfficialPartners.ts"></script>
