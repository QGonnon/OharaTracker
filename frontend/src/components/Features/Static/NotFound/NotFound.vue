<template>
  <Menu />
  <section class="min-h-[70vh] flex items-center bg-white dark:bg-zinc-950 py-20">
    <div class="max-w-xl mx-auto px-6 text-center">
      <span class="inline-block text-violet-600 dark:text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
        {{ $t('errors.not_found.label') }}
      </span>

      <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
        {{ $t('errors.not_found.title') }}
      </h1>

      <p class="text-gray-500 dark:text-zinc-400 leading-relaxed mb-8">
        {{ $t('errors.not_found.description') }}
      </p>

      <Button asChild v-slot="slotProps" class="font-semibold">
        <RouterLink :to="home" :class="slotProps.class">{{ $t('errors.not_found.back_home') }}</RouterLink>
      </Button>

      <nav class="mt-10 pt-8 border-t border-gray-100 dark:border-white/5">
        <p class="text-xs uppercase tracking-widest text-gray-600 dark:text-zinc-400 mb-4">
          {{ $t('errors.not_found.suggestions') }}
        </p>
        <ul class="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <li v-for="link in suggestions" :key="link.to">
            <RouterLink
              :to="link.to"
              class="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
            >
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </section>
</template>

<script src="./NotFound.ts"></script>
