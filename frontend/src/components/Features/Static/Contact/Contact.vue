<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-2xl mx-auto px-6 text-center">
      <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
        {{ $t('static.contact.label') }}
      </span>
      <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
        {{ $t('static.contact.title') }}
      </h1>
      <p class="text-gray-500 dark:text-zinc-400 leading-relaxed mb-10">
        {{ $t('static.contact.desc') }}
      </p>

      <div class="inline-flex flex-col items-center gap-4 p-8 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900">
        <img
          :src="discordQr"
          :alt="$t('static.contact.qr_alt')"
          class="w-44 h-44 rounded-xl border border-gray-200 dark:border-white/10 bg-white p-2" width="176" height="176" loading="lazy" decoding="async" />
        <p class="text-sm text-gray-600 dark:text-zinc-400">{{ $t('static.contact.scan_hint') }}</p>
        <Button asChild v-slot="slotProps" class="font-semibold">
          <a :href="DISCORD_URL" target="_blank" rel="noopener noreferrer" :class="slotProps.class">
            {{ $t('static.contact.join_discord') }}
            <span class="sr-only">({{ $t('common.opens_new_tab') }})</span>
          </a>
        </Button>
      </div>
    </div>
  </section>
</template>

<script src="./Contact.ts"></script>
