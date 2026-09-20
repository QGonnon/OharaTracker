import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Menu from '../../../Shared/Menu/Menu.vue'
import { useAuthStore } from '../../../../store/auth.module'
import StatsService, { type ReadingStats } from '../../../../services/stats.service'
import { usePageSeo } from '../../../../seo/usePageSeo'
import { localePath } from '../../../../seo/localePath'

const READING_STATUS_KEYS: Record<string, string> = {
  'En cours': 'reading',
  'Prévus': 'planned',
  'Terminé': 'completed',
  'Abandonné': 'dropped',
}

export default defineComponent({
  name: 'Stats',
  components: { Menu },

  setup() {
    usePageSeo('stats', { noindex: true })
    const router = useRouter()
    const authStore = useAuthStore()

    const stats = ref<ReadingStats | null>(null)
    const loading = ref(true)
    const error = ref('')
    const filterType = ref('')
    const filterSince = ref('')

    const load = async () => {
      const token = authStore.user?.accessToken
      if (!token) {
        router.push(localePath('login'))
        return
      }

      loading.value = true
      error.value = ''
      try {
        stats.value = await StatsService.get(token, {
          type: filterType.value || undefined,
          since: filterSince.value || undefined,
        })
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        loading.value = false
      }
    }

    const statusLabel = (label: string) => label

    const statusKey = (label: string) => READING_STATUS_KEYS[label] ?? null

    // Les barres sont dessinées en CSS : la largeur est un pourcentage du maximum de la série.
    const ratio = (value: number, max: number) => (max > 0 ? Math.round((value / max) * 100) : 0)

    const maxStatus = computed(() => Math.max(1, ...(stats.value?.byStatus ?? []).map(row => row.count)))
    const maxGenre = computed(() => Math.max(1, ...(stats.value?.advanced?.topGenres ?? []).map(row => row.count)))
    const maxMonth = computed(() => Math.max(1, ...(stats.value?.advanced?.monthlyActivity ?? []).map(row => row.count)))
    const maxScore = computed(() => Math.max(1, ...(stats.value?.advanced?.scoreDistribution ?? []).map(row => row.count)))

    const completionRate = computed(() => {
      const total = stats.value?.worksTracked ?? 0
      if (!total) return 0
      const done = stats.value?.byStatus.find(row => row.label === 'Terminé')?.count ?? 0
      return Math.round((done / total) * 100)
    })

    onMounted(load)

    return {
      stats, loading, error, filterType, filterSince, load,
      statusLabel, statusKey, ratio,
      maxStatus, maxGenre, maxMonth, maxScore, completionRate,
      pricingLink: computed(() => localePath('pricing')),
      libraryLink: computed(() => localePath('library')),
    }
  },
})
