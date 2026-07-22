<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-5xl mx-auto px-6">
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-8 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900">
          <h3 class="font-bold text-gray-900 dark:text-white text-xl mb-2">{{ $t('home.premium_plan_personal') }}</h3>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{{ $t('static.pricing.personal_desc') }}</p>
          <RouterLink to="/register">
            <Button :label="$t('home.start_free')" class="font-semibold" />
          </RouterLink>
        </div>
        <div class="p-8 rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10">
          <h3 class="font-bold text-gray-900 dark:text-white text-xl mb-2">{{ $t('home.premium_plan_pro') }}</h3>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{{ $t('static.pricing.pro_desc') }}</p>
          <RouterLink to="/contact">
            <Button :label="$t('static.pricing.contact_us')" outlined class="font-semibold" />
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
