<template>
  <Menu />

  <!-- HERO -->
  <section class="relative min-h-[calc(100vh-64px)] flex items-center bg-white dark:bg-zinc-950 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

      <!-- Left: headline + CTAs -->
      <div class="flex-1 max-w-xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold tracking-wide mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          {{ $t('home.badge') }}
        </div>

        <h1 class="text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] text-gray-900 dark:text-white tracking-tight mb-5">
          {{ $t('home.heading_1') }}<br>
          <span class="text-violet-600 dark:text-violet-400">{{ $t('home.heading_2') }}</span>
        </h1>

        <p class="text-gray-500 dark:text-zinc-400 text-lg leading-relaxed mb-9">
          {{ $t('home.description') }}
        </p>

        <div class="flex flex-wrap gap-3 mb-9">
          <RouterLink to="/discovery">
            <Button :label="$t('home.start_free')" class="font-semibold" />
          </RouterLink>
          <RouterLink to="/discovery">
            <Button :label="$t('home.see_demo')" severity="secondary" outlined class="font-medium" />
          </RouterLink>
        </div>

        <div class="flex flex-wrap items-center gap-5 text-sm">
          <span class="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
            <i class="pi pi-check-circle text-emerald-500 text-sm" /> {{ $t('home.free') }}
          </span>
          <span class="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
            <i class="pi pi-check-circle text-emerald-500 text-sm" /> {{ $t('home.no_ads') }}
          </span>
        </div>
      </div>

      <!-- Right: App mockup -->
      <div class="flex-1 w-full max-w-md lg:max-w-none lg:flex-none lg:w-[460px]">
        <div class="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/60 dark:shadow-black/50 bg-white dark:bg-zinc-900">

          <!-- Browser chrome -->
          <div class="flex items-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-white/5">
            <div class="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div class="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <div class="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            <div class="ml-3 flex-1 h-5 rounded bg-gray-200 dark:bg-zinc-700 flex items-center px-2.5">
              <span class="text-[11px] text-gray-400 dark:text-zinc-500">{{ $t('home.mock_url') }}</span>
            </div>
          </div>

          <!-- Library -->
          <div class="p-4">
            <div class="flex items-center justify-between mb-3 px-1">
              <span class="text-sm font-semibold text-gray-700 dark:text-zinc-200">{{ $t('home.my_library') }}</span>
              <span class="text-xs text-violet-600 dark:text-violet-400 font-medium">{{ mockItems.length }} {{ $t('home.titles') }}</span>
            </div>

            <div class="space-y-0.5">
              <div v-for="item in mockItems" :key="item.title"
                   class="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                <div :class="`w-8 h-11 rounded flex-shrink-0 ${item.color}`" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-700 dark:text-zinc-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {{ item.title }}
                  </div>
                  <div class="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    {{ $t('home.chapter') }} {{ item.chapter }}
                  </div>
                </div>
                <Tag :value="item.status" :severity="item.severity" class="text-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Stats -->
  <div class="border-y border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900">
    <div class="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
      <div v-for="stat in stats" :key="stat.label">
        <div class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ $t(stat.value) }}</div>
        <div class="text-sm text-gray-400 dark:text-zinc-500 mt-1">{{ $t(stat.label) }}</div>
      </div>
    </div>
  </div>

  <!-- Features -->
  <section class="py-24 bg-white dark:bg-zinc-950">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-16">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('home.features_label') }}
        </span>
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('home.features_heading') }}
        </h2>
        <p class="text-gray-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {{ $t('home.features_desc') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="feat in features" :key="feat.title"
             class="p-6 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900 hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-md dark:hover:shadow-none transition-all duration-200 group">
          <div class="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-200">
            {{ feat.icon }}
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ $t(feat.title) }}</h3>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">{{ $t(feat.desc) }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Étapes comment ça marche -->
  <section class="py-24 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
    <div class="max-w-3xl mx-auto px-6">
      <div class="text-center mb-14">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('home.quickstart_label') }}
        </span>
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white">{{ $t('home.quickstart_heading') }}</h2>
      </div>

      <div class="space-y-4">
        <div v-for="(step, i) in steps" :key="i"
             class="flex items-start gap-5 p-5 rounded-xl bg-white dark:bg-zinc-800/60 border border-gray-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/20 transition-colors">
          <div class="flex-shrink-0 w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm">
            {{ i + 1 }}
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-1">{{ $t(step.title) }}</h4>
            <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">{{ $t(step.text) }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-28 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-white/5">
    <div class="max-w-2xl mx-auto px-6 text-center">
      <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
        {{ $t('home.cta_heading') }}
      </h2>
      <p class="text-gray-500 dark:text-zinc-400 text-lg leading-relaxed mb-8">
        {{ $t('home.cta_desc') }}
      </p>
      <RouterLink to="/discovery">
        <Button :label="$t('home.start_free')" size="large" class="px-10 font-semibold" />
      </RouterLink>
      <p class="text-gray-400 dark:text-zinc-600 text-sm mt-4">{{ $t('home.footer') }}</p>
    </div>
  </section>
</template>

<style scoped>
@import url('./Home.css');
</style>

<script src="./Home.ts"></script>
