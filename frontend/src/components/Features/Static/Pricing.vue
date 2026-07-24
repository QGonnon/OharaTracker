<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-14">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('static.pricing.label') }}
        </span>
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          {{ $t('static.pricing.title') }}
        </h1>
        <p class="text-gray-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {{ $t('static.pricing.desc') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <!-- Starter (free) -->
        <div class="flex flex-col p-8 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900">
          <span class="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
            {{ $t('static.pricing.free_badge') }}
          </span>
          <h3 class="font-bold text-gray-900 dark:text-white text-xl mb-1">{{ $t('static.pricing.free_title') }}</h3>
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">{{ $t('static.pricing.free_price') }}</p>
          <p class="text-xs text-gray-400 dark:text-zinc-500 mb-4">{{ $t('static.pricing.free_price_sub') }}</p>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{{ $t('static.pricing.free_desc') }}</p>

          <ul class="flex flex-col gap-2.5 mb-8 flex-1">
            <li
              v-for="feature in $tm('static.pricing.free_features')"
              :key="feature"
              class="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-300"
            >
              <i class="pi pi-check text-violet-500 mt-0.5 text-xs" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <RouterLink to="/register">
            <Button :label="$t('home.start_free')" class="w-full font-semibold" />
          </RouterLink>
        </div>

        <!-- Premium -->
        <div class="flex flex-col p-8 rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10">
          <span class="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-2">
            {{ $t('static.pricing.premium_badge') }}
          </span>
          <h3 class="font-bold text-gray-900 dark:text-white text-xl mb-1">{{ $t('static.pricing.premium_title') }}</h3>
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">{{ $t('static.pricing.premium_price') }}</p>
          <p class="text-xs text-violet-500 dark:text-violet-400 mb-4">{{ $t('static.pricing.premium_price_sub') }}</p>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{{ $t('static.pricing.premium_desc') }}</p>

          <ul class="flex flex-col gap-2.5 mb-8 flex-1">
            <li
              v-for="feature in $tm('static.pricing.premium_features')"
              :key="feature"
              class="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-300"
            >
              <i class="pi pi-check text-violet-500 mt-0.5 text-xs" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <RouterLink to="/register">
            <Button :label="$t('static.pricing.premium_cta')" class="w-full font-semibold" />
          </RouterLink>
        </div>

        <!-- B2B Partner -->
        <div class="flex flex-col p-8 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10">
          <span class="text-xs font-semibold uppercase tracking-widest text-orange-500 dark:text-orange-400 mb-2">
            {{ $t('static.pricing.partner_badge') }}
          </span>
          <h3 class="font-bold text-gray-900 dark:text-white text-xl mb-1">{{ $t('static.pricing.partner_title') }}</h3>
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">{{ $t('static.pricing.partner_price') }}</p>
          <p class="text-xs text-orange-500 dark:text-orange-400 mb-4">{{ $t('static.pricing.partner_price_sub') }}</p>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{{ $t('static.pricing.partner_desc') }}</p>

          <ul class="flex flex-col gap-2.5 mb-8 flex-1">
            <li
              v-for="feature in $tm('static.pricing.partner_features')"
              :key="feature"
              class="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-300"
            >
              <i class="pi pi-check text-orange-500 mt-0.5 text-xs" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <RouterLink to="/contact">
            <Button :label="$t('static.pricing.contact_us')" outlined class="w-full font-semibold" />
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Menu from '../../Shared/Menu/Menu.vue'
import { Button } from 'primevue'
</script>
