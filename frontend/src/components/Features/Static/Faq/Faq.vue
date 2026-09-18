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
        <p class="text-gray-600 dark:text-zinc-400 leading-relaxed">
          {{ $t('faq.subtitle') }}
        </p>
      </div>

      <Accordion :value="[]" multiple>
        <AccordionPanel v-for="(item, i) in faqItems" :key="i" :value="i">
          <AccordionHeader>
            <template #toggleicon="{ active }">
              <!-- Purement décoratif : l'état est déjà porté par `aria-expanded`
                   que PrimeVue pose sur l'en-tête. -->
              <span class="faq-toggle-icon" aria-hidden="true" :class="{ 'faq-toggle-icon--active': active }">
                {{ active ? '−' : '+' }}
              </span>
            </template>
            {{ item.q }}
          </AccordionHeader>
          <AccordionContent>
            <p class="text-gray-600 dark:text-zinc-400 leading-relaxed">{{ item.a }}</p>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <!-- Maillage interne : une page FAQ isolée ne transmet rien ; ces deux
           liens la relient aux pages qui convertissent. -->
      <nav class="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 text-center"
           :aria-label="$t('faq.more_label')">
        <p class="text-sm text-gray-600 dark:text-zinc-400 mb-4">{{ $t('faq.more_text') }}</p>
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <RouterLink :to="pricingLink" class="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            {{ $t('footer.pricing') }}
          </RouterLink>
          <RouterLink :to="contactLink" class="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            {{ $t('footer.contact') }}
          </RouterLink>
        </div>
      </nav>

    </div>
  </section>
</template>

<style scoped>
.faq-toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1;
  transition: transform 0.2s ease;
}

.faq-toggle-icon--active {
  transform: rotate(180deg);
}
</style>

<script src="./Faq.ts"></script>
