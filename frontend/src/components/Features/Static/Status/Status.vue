<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-2xl mx-auto px-6">
      <div class="text-center mb-12">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('static.status.label') }}
        </span>
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white">
          {{ $t('static.status.title') }}
        </h1>
      </div>

      <div class="space-y-3">
        <div
          v-for="service in services"
          :key="service.key"
          class="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900"
        >
          <span class="font-medium text-gray-700 dark:text-zinc-200">{{ $t(service.key) }}</span>
          <span class="inline-flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {{ $t('static.status.operational') }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script src="./Status.ts"></script>
