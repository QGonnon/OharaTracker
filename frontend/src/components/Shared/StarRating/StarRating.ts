import { defineComponent, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SCORE_MAX, SCORE_STEP, roundScoreToStep, formatScore } from '../../../utils'

// Notation sur 5 étoiles avec demi-points.
//
// PrimeVue Rating ne gère que des étoiles pleines : la demi-étoile est donc
// dessinée ici, en superposant une étoile pleine rognée à la largeur voulue.
//
// Accessibilité : le widget entier porte role="slider" et se pilote au clavier
// (flèches, Début, Fin). Les demi-zones cliquables ne sont que des cibles de
// souris — elles ne captent pas le focus, la sémantique reste sur le slider.
export default defineComponent({
  name: 'StarRating',

  props: {
    modelValue: { type: Number as () => number | null, default: null },
    readonly: { type: Boolean, default: false },
    /** Id cible d'un <label for> ; ignoré en lecture seule. */
    inputId: { type: String, default: undefined },
    /** Taille des étoiles : classe Tailwind de police. */
    size: { type: String, default: 'text-xl' },
    /** Affiche « 3,5/5 » à côté des étoiles. */
    showValue: { type: Boolean, default: true },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const { t, locale } = useI18n()
    const hovered = ref<number | null>(null)

    const stars = computed(() => Array.from({ length: SCORE_MAX }, (_, i) => i + 1))

    /** Valeur affichée : le survol prime sur la valeur enregistrée, pour prévisualiser. */
    const shown = computed(() => hovered.value ?? props.modelValue ?? 0)

    /** Remplissage d'une étoile, en pourcentage : 100, 50 ou 0. */
    const fillOf = (index: number) => Math.min(Math.max(shown.value - (index - 1), 0), 1) * 100

    const formatted = computed(() => formatScore(props.modelValue, locale.value))

    const valueText = computed(() =>
      props.modelValue === null
        ? t('rating.none')
        : t('rating.value', { score: formatted.value, max: SCORE_MAX })
    )

    // Mesure faite en emulation mobile : une demi-etoile fait 8 x 20 px, tres en
    // dessous des 44 x 44 recommandes (WCAG 2.5.5). Agrandir les etoiles n'est pas
    // possible sans toucher au theme PrimeVue, qui impose leur taille. Deux boutons
    // a taille conforme offrent donc le meme reglage a cote des etoiles.
    const atMin = computed(() => (props.modelValue ?? 0) <= 0)
    const atMax = computed(() => (props.modelValue ?? 0) >= SCORE_MAX)

    /** Message lu par les lecteurs d'ecran apres un appui : le focus reste sur le
     *  bouton, donc le curseur n'annonce rien de lui-meme. */
    const announcement = ref('')

    const setValue = (value: number | null) => {
      if (props.readonly) return
      emit('update:modelValue', value === null ? null : roundScoreToStep(value))
    }

    /** Moitié gauche d'une étoile = demi-point, moitié droite = étoile pleine. */
    const pick = (index: number, half: boolean) => {
      const value = half ? index - SCORE_STEP : index
      // Recliquer la même valeur l'efface : sans cela, revenir à « pas de note »
      // serait impossible à la souris.
      setValue(props.modelValue === value ? null : value)
    }

    const preview = (index: number, half: boolean) => {
      if (!props.readonly) hovered.value = half ? index - SCORE_STEP : index
    }

    const clearPreview = () => { hovered.value = null }

    /** Un appui = un demi-point, borne au bareme. */
    const nudge = (direction: 1 | -1) => {
      if (props.readonly) return

      const next = roundScoreToStep((props.modelValue ?? 0) + direction * SCORE_STEP)
      if (next === props.modelValue) return

      setValue(next)
      announcement.value = t('rating.value', { score: formatScore(next, locale.value), max: SCORE_MAX })
    }

    /** « 0,5 » ou « 0.5 » selon la langue, pour nommer les deux boutons. */
    const stepText = computed(() => formatScore(SCORE_STEP, locale.value))

    const onKeydown = (event: KeyboardEvent) => {
      if (props.readonly) return

      const current = props.modelValue ?? 0
      const keys: Record<string, number | null> = {
        ArrowRight: current + SCORE_STEP,
        ArrowUp: current + SCORE_STEP,
        ArrowLeft: current - SCORE_STEP,
        ArrowDown: current - SCORE_STEP,
        Home: 0,
        End: SCORE_MAX,
        Delete: null,
        Backspace: null,
      }

      if (!(event.key in keys)) return
      event.preventDefault()
      setValue(keys[event.key])
    }

    return {
      stars,
      max: SCORE_MAX,
      fillOf,
      formatted,
      valueText,
      pick,
      nudge,
      atMin,
      atMax,
      stepText,
      announcement,
      preview,
      clearPreview,
      onKeydown,
      clear: () => setValue(null),
    }
  },
})
