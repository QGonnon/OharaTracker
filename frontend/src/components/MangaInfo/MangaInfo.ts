import { defineComponent, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Menu from '../Menu/Menu.vue'
import { slugify } from '../../utils'

interface Manga {
  id: string
  title: string
  lastChapter: string
  chapterUrl: string
  mangaUrl: string
  site: string
  theme: string
  status: string
  author: string
  description: string
  publishers: string
}

export default defineComponent({
  name: 'MangaInfo',
  components: { Menu },

  setup() {
    const route = useRoute()
    const manga = ref<Manga>({} as Manga)
    const loading = ref<boolean>(true)
    const error = ref<string | null>(null)

    // 🚀 Récupération du manga depuis ton API
    const fetchMangas = async () => {
      loading.value = true
      error.value = null

      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/chapters`
        const response = await fetch(apiUrl)
        const chapters = (await response.json()) || []

        const mangaList: Manga[] = chapters.map((chapter: any) => ({
          id: chapter.chapterId || chapter.id,
          title: chapter.title || chapter.name,
          lastChapter: chapter.lastChapter || chapter.chapter,
          chapterUrl: chapter.chapterUrl || chapter.url,
          mangaUrl: chapter.mangaUrl,
          site: chapter.site,
          theme: chapter.theme,
          status: chapter.status,
          author: chapter.author,
          description: chapter.description,
          publishers: chapter.publishers
        }))

        // Trouver le manga correspondant à l’URL
        const found = mangaList.find(
          (m) => slugify(m.title) === route.params.name
        )

        if (found) {
          manga.value = found
        } else {
          manga.value = {} as Manga
          error.value = 'Manga non trouvé.'
        }
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des mangas :', err)
        error.value = 'Erreur de connexion au serveur.'
      } finally {
        loading.value = false
      }
    }

    // 🕓 Chargement initial
    onMounted(fetchMangas)

    // 🔁 Mise à jour si l’URL change
    watch(
      () => route.params.name,
      (newName, oldName) => {
        if (newName !== oldName) fetchMangas()
      }
    )

    return { manga, loading, error }
  }
})
