<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-slate-950 py-20">
    <div class="max-w-3xl mx-auto px-6">
      <div class="text-center mb-12">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('static.official_partners.label') }}
        </span>
        <h1 class="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          {{ $t('static.official_partners.title') }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          {{ $t('static.official_partners.desc') }}
        </p>
      </div>

      <p v-if="loading" class="text-center text-slate-600 dark:text-slate-300 text-sm">
        {{ $t('static.official_partners.loading') }}
      </p>

      <p v-else-if="!partners.length" class="text-center text-slate-600 dark:text-slate-300 text-sm">
        {{ $t('static.official_partners.empty') }}
      </p>

      <template v-else>
        <!-- Partenaires mis en avant : l'offre B2B payante -->
        <div v-if="highlighted.length" class="grid sm:grid-cols-2 gap-4 mb-8">
          <a
            v-for="partner in highlighted"
            :key="partner.name"
            :href="partner.url || undefined"
            target="_blank"
            rel="noopener nofollow"
            class="p-6 rounded-2xl border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-400 dark:hover:border-violet-600 transition"
          >
            <img v-if="partner.logoUrl" :src="partner.logoUrl" :alt="partner.name" loading="lazy" class="h-8 mb-3" />
            <span class="block font-bold text-slate-900 dark:text-white">{{ partner.name }}</span>
            <span v-if="partner.description" class="block text-sm text-slate-600 dark:text-slate-300 mt-1">{{ partner.description }}</span>
          </a>
        </div>

        <div v-if="others.length" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <a
            v-for="partner in others"
            :key="partner.name"
            :href="partner.url || undefined"
            target="_blank"
            rel="noopener nofollow"
            class="p-5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 text-center font-semibold text-slate-700 dark:text-slate-200 hover:border-violet-300 dark:hover:border-violet-700 transition"
          >
            {{ partner.name }}
          </a>
        </div>
      </template>

      <p class="text-center text-sm mt-10 text-slate-600 dark:text-slate-300">
        {{ $t('static.official_partners.become') }}
        <RouterLink :to="contactLink" class="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
          {{ $t('static.official_partners.contact_us') }}
        </RouterLink>
      </p>
    </div>
  </section>
</template>

<script src="./OfficialPartners.ts"></script>
