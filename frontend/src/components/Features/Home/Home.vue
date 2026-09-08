<template>
  <Menu />

  <!-- ═══════════════════════════════════════════════
       HERO
  ════════════════════════════════════════════════ -->
  <section class="relative min-h-[calc(100vh-64px)] flex items-center bg-white dark:bg-zinc-950 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

      <!-- Left: headline + CTAs + stats intégrées -->
      <div class="flex-1 max-w-xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold tracking-wide mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          {{ $t('home.badge') }}
        </div>

        <h1 class="text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] text-gray-900 dark:text-white tracking-tight mb-5">
          {{ $t('home.heading_1') }}<br>
          <span class="text-violet-600 dark:text-violet-400">{{ $t('home.heading_2') }}</span>
        </h1>

        <p class="text-gray-500 dark:text-zinc-400 text-lg leading-relaxed mb-8">
          {{ $t('home.description') }}
        </p>

        <div class="flex flex-wrap gap-3 mb-8">
          <Button asChild v-slot="slotProps" class="font-semibold">
            <RouterLink :to="registerPath" :class="slotProps.class">{{ $t('home.start_free') }}</RouterLink>
          </Button>
          <Button
            :label="$t('home.see_demo')"
            severity="secondary"
            outlined
            class="font-medium"
            @click="scrollToScreenshots"
          />
        </div>

        <!-- Stats intégrées dans le hero (remplace le bloc solo) -->
        <div class="grid grid-cols-2 gap-x-8 gap-y-3 pt-6 border-t border-gray-100 dark:border-white/5">
          <div v-for="stat in stats" :key="stat.label">
            <span class="text-lg font-bold text-gray-900 dark:text-white">{{ stat.value }}</span>
            <span class="text-xs text-gray-600 dark:text-zinc-400 ml-1.5">{{ $t(stat.label) }}</span>
          </div>
        </div>
      </div>

      <!-- Right: App mockup -->
      <div class="flex-1 w-full max-w-md lg:max-w-none lg:flex-none lg:w-[460px]" aria-hidden="true">
        <div class="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/60 dark:shadow-black/50 bg-white dark:bg-zinc-900">
          <div class="flex items-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-white/5">
            <div class="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div class="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <div class="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            <div class="ml-3 flex-1 h-5 rounded bg-gray-200 dark:bg-zinc-700 flex items-center px-2.5">
              <span class="text-[11px] text-gray-600 dark:text-zinc-400">{{ $t('home.mock_url') }}</span>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between mb-3 px-1">
              <span class="text-sm font-semibold text-gray-700 dark:text-zinc-200">{{ $t('home.my_library') }}</span>
              <span class="text-xs text-violet-600 dark:text-violet-400 font-medium">{{ mockItems.length }} {{ $t('home.titles') }}</span>
            </div>
            <div class="space-y-0.5">
              <div v-for="item in mockItems" :key="item.title"
                   class="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors">
                <div :class="`w-8 h-11 rounded flex-shrink-0 ${item.color}`" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-700 dark:text-zinc-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {{ item.title }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                    {{ $t('home.chapter') }} {{ item.chapter }}
                  </div>
                </div>
                <Tag :value="$t(item.statusKey)" :severity="item.severity" class="text-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- ═══════════════════════════════════════════════
       APERÇU / SCREENSHOTS  (fond gris)
       Cible du bouton "Voir la démo"
  ════════════════════════════════════════════════ -->
  <section id="screenshots" class="py-24 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-16">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('home.screenshots_label') }}
        </span>
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('home.screenshots_heading') }}
        </h2>
        <p class="text-gray-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {{ $t('home.screenshots_desc') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-12 items-start">

        <!-- Zone 1 : Bibliothèque & Découverte — côte à côte, chaque image cliquable -->
        <div class="flex flex-col gap-3">
          <div class="flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg relative">
          <!-- Barre browser fictive -->
          <div class="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-zinc-700 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
            <div class="w-2 h-2 rounded-full bg-red-400/70" />
            <div class="w-2 h-2 rounded-full bg-yellow-400/70" />
            <div class="w-2 h-2 rounded-full bg-green-400/70" />
          </div>
          <!--
            Images côte à côte. Les déclencheurs étaient des <img> avec @click :
            impossibles à activer au clavier. Un <button> est nativement
            focusable, activable par Entrée/Espace et annoncé comme tel.
            Les `alt` étaient aussi codés en dur en français sur un site en 5 langues.
          -->
          <div class="flex relative">
            <button
              type="button"
              class="w-1/2 cursor-zoom-in hover:brightness-105 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-600"
              @click="openLightbox(libraryImg, $t('home.screenshot_library_alt'))"
            >
              <img
                :src="libraryImg"
                :alt="$t('home.screenshot_library_alt')"
                width="1261" height="877" loading="lazy" decoding="async"
                class="w-full h-full object-cover object-top"
              />
            </button>
            <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/25 dark:bg-white/10 z-10 pointer-events-none" />
            <button
              type="button"
              class="w-1/2 cursor-zoom-in hover:brightness-105 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-600"
              @click="openLightbox(discoveryImg, $t('home.screenshot_discovery_alt'))"
            >
              <img
                :src="discoveryImg"
                :alt="$t('home.screenshot_discovery_alt')"
                width="1568" height="749" loading="lazy" decoding="async"
                class="w-full h-full object-cover object-top"
              />
            </button>
          </div>
        </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1">{{ $t('home.screenshot_library_title') }}</h3>
            <p class="text-gray-600 dark:text-zinc-400 text-xs leading-relaxed">{{ $t('home.screenshot_library_desc') }}</p>
          </div>
        </div>

        <!-- Zone 2 : Mes Suivis — mockup navigateur -->
        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="block w-full text-left rounded-xl overflow-hidden border border-violet-200 dark:border-violet-500/30 shadow-lg ring-1 ring-violet-200/50 dark:ring-violet-500/20 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            @click="openLightbox(trackingImg, $t('home.screenshot_tracking_alt'))"
          >
            <div class="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-zinc-700 border-b border-gray-100 dark:border-white/5">
              <div class="w-2 h-2 rounded-full bg-red-400/70" />
              <div class="w-2 h-2 rounded-full bg-yellow-400/70" />
              <div class="w-2 h-2 rounded-full bg-green-400/70" />
            </div>
            <img :src="trackingImg" :alt="$t('home.screenshot_tracking_alt')" width="1236" height="691" loading="lazy" decoding="async" class="w-full object-cover object-top hover:brightness-105 transition-all duration-200" />
          </button>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 text-[10px] font-semibold">
              <i class="pi pi-star-fill text-[9px]"  aria-hidden="true"/> {{ $t('home.screenshot_tracking_badge') }}
            </span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1">{{ $t('home.screenshot_tracking_title') }}</h3>
            <p class="text-gray-600 dark:text-zinc-400 text-xs leading-relaxed">{{ $t('home.screenshot_tracking_desc') }}</p>
          </div>
        </div>

        <!-- Zone 3 : Profil — mockup navigateur -->
        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="block w-full text-left rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            @click="openLightbox(profileImg, $t('home.screenshot_profile_alt'))"
          >
            <div class="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-zinc-700 border-b border-gray-100 dark:border-white/5">
              <div class="w-2 h-2 rounded-full bg-red-400/70" />
              <div class="w-2 h-2 rounded-full bg-yellow-400/70" />
              <div class="w-2 h-2 rounded-full bg-green-400/70" />
            </div>
            <img :src="profileImg" :alt="$t('home.screenshot_profile_alt')" width="1077" height="848" loading="lazy" decoding="async" class="w-full object-cover object-top hover:brightness-105 transition-all duration-200" />
          </button>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1">{{ $t('home.screenshot_profile_title') }}</h3>
            <p class="text-gray-600 dark:text-zinc-400 text-xs leading-relaxed">{{ $t('home.screenshot_profile_desc') }}</p>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!--
    Lightbox — dialogue modal.

    Elle n'avait ni rôle, ni nom, ni fermeture au clavier, et l'image n'avait pas
    d'`alt` : une fois ouverte, un utilisateur au clavier y était enfermé.
    Le focus part sur le bouton de fermeture et revient sur le déclencheur à la
    sortie ; comme le dialogue ne contient qu'un seul élément focusable, Tab y
    est simplement reconduit, ce qui suffit à piéger le focus correctement.
  -->
  <Teleport to="body">
    <Transition name="lb">
      <div
        v-if="lightboxSrc"
        role="dialog"
        aria-modal="true"
        :aria-label="lightboxAlt"
        tabindex="-1"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out p-6"
        @click="closeLightbox"
        @keydown.esc="closeLightbox"
        @keydown.tab.prevent="trapFocus"
      >
        <img
          :src="lightboxSrc"
          :alt="lightboxAlt"
          class="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
          @click.stop decoding="async" />
        <button
          ref="lightboxCloseRef"
          type="button"
          :aria-label="$t('common.close')"
          class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          @click="closeLightbox"
        >
          <i class="pi pi-times text-sm" aria-hidden="true" />
        </button>
      </div>
    </Transition>
  </Teleport>

  <!-- ═══════════════════════════════════════════════
       FONCTIONNALITÉS  (fond blanc)
  ════════════════════════════════════════════════ -->
  <section class="py-24 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-white/5">
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

  <!-- ═══════════════════════════════════════════════
       DÉMARRAGE RAPIDE — affiché uniquement si non connecté
  ════════════════════════════════════════════════ -->
  <section v-if="!isLoggedIn" class="py-24 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5">
    <div class="max-w-3xl mx-auto px-6">
      <div class="text-center mb-14">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('home.quickstart_label') }}
        </span>
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white">{{ $t('home.quickstart_heading') }}</h2>
      </div>

      <div class="space-y-4 mb-6">
        <div v-for="(step, i) in steps" :key="i"
             class="flex items-start gap-5 p-5 rounded-xl bg-white dark:bg-zinc-800/60 border border-gray-100 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/20 transition-colors">
          <div class="flex-shrink-0 w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm">
            {{ i + 1 }}
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ $t(step.title) }}</h3>
            <p class="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">{{ $t(step.text) }}</p>
          </div>
        </div>
      </div>

      <!-- CTA inscription : bouton-carte cliquable entier -->
      <RouterLink :to="registerPath" class="block mt-8">
        <div class="group rounded-2xl border border-violet-200 dark:border-violet-500/25 bg-white dark:bg-zinc-800/60 hover:border-violet-400 dark:hover:border-violet-500/50 hover:shadow-lg dark:hover:shadow-violet-500/5 transition-all duration-200 cursor-pointer px-8 py-7 text-center">
          <p class="font-bold text-gray-900 dark:text-white text-xl mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {{ $t('home.cta_heading') }}
          </p>
          <p class="text-gray-600 dark:text-zinc-400 text-sm">{{ $t('home.footer') }}</p>
          <!-- Flèche décorative -->
          <div class="mt-4 inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-sm font-semibold">
            {{ $t('home.start_free') }}
            <i class="pi pi-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-1"  aria-hidden="true"/>
          </div>
        </div>
      </RouterLink>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════
       PREMIUM CTA
  ════════════════════════════════════════════════ -->
  <section class="relative py-28 overflow-hidden border-t border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-950">

    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute -top-32 left-1/4 w-[520px] h-[520px] bg-violet-600/8 dark:bg-violet-600/15 rounded-full blur-3xl" />
      <div class="absolute -bottom-24 right-1/4 w-[420px] h-[420px] bg-indigo-500/8 dark:bg-indigo-500/12 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 max-w-5xl mx-auto px-6">
      <div class="rounded-3xl border border-gray-100 dark:border-white/8 bg-gray-50/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-xl dark:shadow-black/40 px-10 py-14 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

        <div class="flex-1 text-center lg:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide mb-5"
              style="background: linear-gradient(90deg, rgba(79,70,229,0.08), rgba(249,115,22,0.08)); border-color: rgba(79,70,229,0.3);">
            <i class="pi pi-crown text-xs" style="color: #4f46e5"  aria-hidden="true"/>
            <span style="background: linear-gradient(90deg, #4f46e5, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              {{ $t('home.premium_badge') }}
            </span>
          </div>

          <h2 class="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-tight"
              style="background: linear-gradient(90deg, #4f46e5, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            {{ $t('home.premium_heading') }}
          </h2>

          <p class="text-gray-500 dark:text-zinc-400 text-base leading-relaxed mb-6 max-w-lg">
            {{ $t('home.premium_desc') }}
          </p>

          <!-- Pills côte à côte -->
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10">
              <i class="pi pi-bookmark-fill text-violet-600 dark:text-violet-400"  aria-hidden="true"/>
              <div>
                <p class="text-xs text-violet-700 dark:text-violet-400 font-semibold uppercase tracking-wide leading-none mb-0.5">{{ $t('home.premium_plan_personal_label') }}</p>
                <p class="font-bold text-violet-700 dark:text-violet-300 text-base leading-none">{{ $t('home.premium_plan_personal') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10">
              <i class="pi pi-crown text-orange-700 dark:text-orange-400"  aria-hidden="true"/>
              <div>
                <p class="text-xs text-orange-700 dark:text-orange-400 font-semibold uppercase tracking-wide leading-none mb-0.5">{{ $t('home.premium_plan_pro_label') }}</p>
                <p class="font-bold text-orange-700 dark:text-orange-300 text-base leading-none">{{ $t('home.premium_plan_pro') }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-shrink-0 flex flex-col items-center gap-4">
          <Button asChild v-slot="slotProps" size="large" class="px-8 font-semibold">
            <RouterLink
              :to="pricingPath"
              :class="slotProps.class"
              style="background: linear-gradient(90deg, #4f46e5, #c2410c); border: none;"
            >{{ $t('home.premium_cta') }}</RouterLink>
          </Button>
          <p class="text-xs text-gray-600 dark:text-zinc-400 text-center max-w-[14rem] leading-relaxed">
            {{ $t('home.premium_sub') }}
          </p>
        </div>

      </div>
    </div>
  </section>

</template>

<style scoped>
@import url('./Home.css');
</style>

<script src="./Home.ts"></script>