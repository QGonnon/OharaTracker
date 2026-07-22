<template>
  <Menu />
  <section class="min-h-[70vh] bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-3xl mx-auto px-6">
      <div class="text-center mb-12">
        <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          {{ $t('faq.label') }}
        </span>
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
          {{ $t('faq.title') }}
        </h1>
        <p class="text-gray-500 dark:text-zinc-400 leading-relaxed">
          {{ $t('faq.subtitle') }}
        </p>
      </div>

      <Accordion :value="[]" multiple>
        <AccordionPanel v-for="(item, i) in items" :key="i" :value="i">
          <AccordionHeader>{{ item.q }}</AccordionHeader>
          <AccordionContent>
            <p class="text-gray-500 dark:text-zinc-400 leading-relaxed">{{ item.a }}</p>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Menu from '../../Shared/Menu/Menu.vue'
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primevue'

const { tm } = useI18n()

// tm() renvoie les ressources brutes (tableaux/objets) sans interpolation,
// adapté à une liste statique de questions/réponses traduites.
const items = computed(() => tm('faq.items') as { q: string; a: string }[])
</script>
