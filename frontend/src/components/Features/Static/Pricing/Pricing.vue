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

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-24">
        <!-- Lite -->
        <div class="flex flex-col p-8 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900">
          <span class="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-zinc-400 mb-2">
            {{ $t('static.pricing.lite_badge') }}
          </span>
          <h2 class="font-bold text-gray-900 dark:text-white text-xl mb-1">{{ $t('static.pricing.lite_title') }}</h2>
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">{{ $t('static.pricing.lite_price') }}</p>
          <p class="text-xs text-gray-600 dark:text-zinc-400 mb-6">{{ $t('static.pricing.lite_price_sub') }}</p>

          <ul class="flex flex-col gap-2.5 mb-8 flex-1">
            <li
              v-for="feature in $tm('static.pricing.lite_features')"
              :key="feature"
              class="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-300"
            >
              <i class="pi pi-check text-violet-500 mt-0.5 text-xs"  aria-hidden="true"/>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <Button
            :label="liteCtaLabel"
            class="w-full font-semibold"
            :loading="checkoutLoadingPlan === 'lite'"
            :disabled="isLiteDisabled"
            @click="handleCheckout('lite')"
          />
        </div>

        <!-- Pro -->
        <div class="flex flex-col p-8 rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10">
          <span class="inline-block w-fit text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300 bg-violet-100 dark:bg-violet-500/20 rounded-full px-2.5 py-1 mb-2">
            {{ $t('static.pricing.pro_badge') }}
          </span>
          <h2 class="font-bold text-gray-900 dark:text-white text-xl mb-1">{{ $t('static.pricing.pro_title') }}</h2>
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">{{ $t('static.pricing.pro_price') }}</p>
          <p class="text-xs text-violet-700 dark:text-violet-400 mb-6">{{ $t('static.pricing.pro_price_sub') }}</p>

          <ul class="flex flex-col gap-2.5 mb-8 flex-1">
            <li
              v-for="feature in $tm('static.pricing.pro_features')"
              :key="feature"
              class="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-300"
            >
              <i class="pi pi-check text-violet-500 mt-0.5 text-xs"  aria-hidden="true"/>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <Button
            :label="proCtaLabel"
            class="w-full font-semibold"
            :loading="checkoutLoadingPlan === 'pro'"
            :disabled="isProDisabled"
            @click="handleCheckout('pro')"
          />
        </div>

        <!-- B2B Partner -->
        <div class="flex flex-col p-8 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10">
          <span class="text-xs font-semibold uppercase tracking-widest text-orange-700 dark:text-orange-400 mb-2">
            {{ $t('static.pricing.partner_badge') }}
          </span>
          <h2 class="font-bold text-gray-900 dark:text-white text-xl mb-1">{{ $t('static.pricing.partner_title') }}</h2>
          <p class="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">{{ $t('static.pricing.partner_price') }}</p>
          <p class="text-xs text-orange-700 dark:text-orange-400 mb-6">{{ $t('static.pricing.partner_price_sub') }}</p>
          <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">{{ $t('static.pricing.partner_desc') }}</p>

          <ul class="flex flex-col gap-2.5 mb-8 flex-1">
            <li
              v-for="feature in $tm('static.pricing.partner_features')"
              :key="feature"
              class="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-300"
            >
              <i class="pi pi-check text-orange-700 mt-0.5 text-xs"  aria-hidden="true"/>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <Button asChild v-slot="slotProps" outlined class="w-full font-semibold">
            <RouterLink :to="contactLink" :class="slotProps.class">{{ $t('static.pricing.partner_cta') }}</RouterLink>
          </Button>
        </div>
      </div>

      <!-- FAQ -->
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-12">
          <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
            {{ $t('faq.label') }}
          </span>
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            {{ $t('faq.title') }}
          </h2>
          <p class="text-gray-500 dark:text-zinc-400 leading-relaxed">
            {{ $t('faq.subtitle') }}
          </p>
        </div>

        <Accordion :value="[]" multiple>
          <AccordionPanel v-for="(item, i) in faqItems" :key="i" :value="i">
            <AccordionHeader>
              <template #toggleicon="{ active }">
                <span class="faq-toggle-icon" :class="{ 'faq-toggle-icon--active': active }">{{ active ? '−' : '+' }}</span>
              </template>
              {{ item.q }}
            </AccordionHeader>
            <AccordionContent>
              <p class="text-gray-500 dark:text-zinc-400 leading-relaxed">{{ item.a }}</p>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
    </div>
  </section>
</template>

<script src="./Pricing.ts"></script>

<style>
@import './Pricing.css';
</style>
