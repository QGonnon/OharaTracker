import { defineComponent, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Menu from '../../../Shared/Menu/Menu.vue'
import { useAuthStore } from '../../../../store/auth.module'
import StatsService, { gamificationService, type ReadingStats, type Badge, type FriendRank } from '../../../../services/stats.service'
import { usePageSeo } from '../../../../seo/usePageSeo'
import { localePath } from '../../../../seo/localePath'
import { formatScore, SCORE_MAX } from '../../../../utils'

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
    const { locale } = useI18n()
    const router = useRouter()
    const authStore = useAuthStore()

    const stats = ref<ReadingStats | null>(null)
    const loading = ref(true)
    const error = ref('')
    const filterType = ref('')
    const filterSince = ref('')
    const badges = ref<Badge[]>([])
    const ranking = ref<FriendRank[]>([])

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
        // Badges et classement sont accessoires : leur echec ne doit pas vider la page.
        const [badgeData, rankData] = await Promise.all([
          gamificationService.badges(token).catch(() => []),
          gamificationService.friendRanking(token).catch(() => []),
        ])
        badges.value = badgeData
        ranking.value = rankData
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
      scoreMax: SCORE_MAX,
      formatScore: (value: number | string | null | undefined) => formatScore(value, locale.value),
      stats, loading, error, filterType, filterSince, load, badges, ranking,
      tierClass: (tier: string | null) => ({
        gold: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        silver: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500',
        bronze: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      }[tier ?? ''] ?? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'),
      statusLabel, statusKey, ratio,
      maxStatus, maxGenre, maxMonth, maxScore, completionRate,
      pricingLink: computed(() => localePath('pricing')),
      libraryLink: computed(() => localePath('library')),
    }
  },
})
