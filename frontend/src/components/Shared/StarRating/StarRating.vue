<template>
  <div class="inline-flex flex-wrap items-center gap-2">
    <!-- Une demi-etoile fait 8 x 20 px : trop petite au doigt. Ces deux boutons
         offrent le meme reglage sur une cible de 44 x 44. Absents en lecture
         seule : aucun controle ne doit suggerer une action qui n'existe pas. -->
    <button
      v-if="!readonly"
      type="button"
      class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-40 disabled:cursor-not-allowed"
      :aria-label="$t('rating.decrease', { step: stepText })"
      :disabled="atMin"
      @click="nudge(-1)"
    >
      <i class="pi pi-minus text-sm" aria-hidden="true"></i>
    </button>

    <div
      :id="inputId"
      class="inline-flex items-center gap-0.5"
      :class="readonly ? '' : 'cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600'"
      :role="readonly ? 'img' : 'slider'"
      :tabindex="readonly ? undefined : 0"
      :aria-label="$t('rating.label', { max })"
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

    <button
      v-if="!readonly"
      type="button"
      class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-40 disabled:cursor-not-allowed"
      :aria-label="$t('rating.increase', { step: stepText })"
      :disabled="atMax"
      @click="nudge(1)"
    >
      <i class="pi pi-plus text-sm" aria-hidden="true"></i>
    </button>

    <span v-if="showValue && modelValue !== null" class="text-sm tabular-nums text-slate-600 dark:text-slate-300">
      {{ $t('rating.value', { score: formatted, max }) }}
    </span>

    <button
      v-if="!readonly && modelValue !== null"
      type="button"
      class="inline-flex min-h-11 items-center px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 underline"
      @click="clear"
    >
      {{ $t('rating.clear') }}
    </button>

    <!-- Apres un appui sur + ou -, le focus reste sur le bouton : le curseur
         n'annonce donc rien. Alimentee uniquement par nudge(), pour ne pas
         doubler l'annonce que fait deja le curseur au clavier. -->
    <span class="sr-only" role="status" aria-live="polite">{{ announcement }}</span>
  </div>
</template>

<script lang="ts">
import component from './StarRating.ts'
export default component
</script>
