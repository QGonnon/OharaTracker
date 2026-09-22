<template>
  <div class="inline-flex items-center gap-2">
    <div
      :id="inputId"
      class="inline-flex items-center gap-0.5"
      :class="readonly ? '' : 'cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'"
      :role="readonly ? 'img' : 'slider'"
      :tabindex="readonly ? undefined : 0"
      :aria-label="$t('rating.label')"
      :aria-valuemin="readonly ? undefined : 0"
      :aria-valuemax="readonly ? undefined : max"
      :aria-valuenow="readonly ? undefined : (modelValue ?? 0)"
      :aria-valuetext="valueText"
      :aria-readonly="readonly ? 'true' : undefined"
      @keydown="onKeydown"
      @mouseleave="clearPreview"
    >
      <span
        v-for="i in stars"
        :key="i"
        class="relative inline-block leading-none"
        :class="size"
        role="presentation"
      >
        <i class="pi pi-star text-slate-300 dark:text-slate-600" aria-hidden="true"></i>

        <!-- Étoile pleine rognée : c'est ce qui produit la demi-étoile. -->
        <span
          class="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
          :style="{ width: fillOf(i) + '%' }"
          aria-hidden="true"
        >
          <i class="pi pi-star-fill text-amber-600 dark:text-amber-400"></i>
        </span>

        <!-- Cibles de souris uniquement : la sémantique et le clavier vivent sur le slider. -->
        <template v-if="!readonly">
          <span role="presentation" class="absolute inset-y-0 left-0 w-1/2"
                @click="pick(i, true)" @mousemove="preview(i, true)"></span>
          <span role="presentation" class="absolute inset-y-0 right-0 w-1/2"
                @click="pick(i, false)" @mousemove="preview(i, false)"></span>
        </template>
      </span>
    </div>

    <span v-if="showValue && modelValue !== null" class="text-sm tabular-nums text-slate-600 dark:text-slate-300">
      {{ $t('rating.value', { score: formatted, max }) }}
    </span>

    <button
      v-if="!readonly && modelValue !== null"
      type="button"
      class="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
      @click="clear"
    >
      {{ $t('rating.clear') }}
    </button>
  </div>
</template>

<script lang="ts">
import component from './StarRating.ts'
export default component
</script>
