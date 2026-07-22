<template>
  <footer class="layout-footer">
    <div class="footer-inner max-w-7xl mx-auto w-full px-4 sm:px-6 pt-12 pb-6">

      <div class="grid grid-cols-2 md:grid-cols-5 gap-8">

        <!-- Logo + baseline + socials -->
        <div class="col-span-2 md:col-span-2 flex flex-col gap-4">
          <RouterLink to="/" class="text-xl font-extrabold footer-logo w-fit">
            Ohara Tracker
          </RouterLink>
          <p class="text-sm text-gray-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            {{ $t('footer.tagline') }}
          </p>

          <div class="flex items-center gap-3 mt-1">
            <a
              :href="DISCORD_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-social-btn"
              :title="$t('footer.discord')"
            >
              <!-- Discord glyph (inline SVG, no extra icon-pack dependency) -->
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M20.32 4.37a19.8 19.8 0 0 0-4.9-1.52.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.3 18.3 0 0 0-5.46 0 12.6 12.6 0 0 0-.62-1.26.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.9 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1 0-.13c.13-.09.25-.19.37-.28a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.19.37.28a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.83-9.67-3.53-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.17 1.1 2.15 2.42 0 1.34-.95 2.42-2.15 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.17 1.1 2.15 2.42 0 1.34-.94 2.42-2.15 2.42Z"/>
              </svg>
            </a>
            <!-- TODO: mettre à jour TWITTER_URL dans Footer.ts une fois le compte X créé -->
            <a
              :href="TWITTER_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-social-btn"
              :title="$t('footer.twitter')"
            >
              <!-- X / Twitter glyph (inline SVG, no extra icon-pack dependency) -->
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M18.24 3H21l-6.35 7.26L22 21h-6.19l-4.85-6.34L5.4 21H2.62l6.8-7.77L2 3h6.34l4.38 5.8L18.24 3Zm-1.08 16.17h1.53L7.9 4.74H6.26l10.9 14.43Z"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Columns -->
        <div v-for="col in columns" :key="col.title" class="col-span-1">
          <h4 class="footer-col-title">{{ col.title }}</h4>
          <ul class="flex flex-col gap-2.5 mt-3">
            <li v-for="link in col.links" :key="link.to">
              <RouterLink :to="link.to" class="footer-link">
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

      </div>

      <div class="footer-bottom mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-xs text-gray-400 dark:text-zinc-500">
          &copy; {{ year }} Ohara Tracker — {{ $t('footer.rights') }}
        </p>
        <RouterLink to="/contact" class="text-xs font-medium footer-link">
          {{ $t('footer.contact') }}
        </RouterLink>
      </div>

    </div>
  </footer>
</template>

<script lang="ts">
import component from './Footer.ts'
export default component
</script>

<style src="./Footer.css"></style>
