import { defineComponent, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useAuthStore } from '../../../store/auth.module'

export default defineComponent({
  name: 'EditAnimeDialog',
  components: { Dialog, Dropdown, InputText, Button },
  props: {
    visible: { type: Boolean, required: true },
    anime: { type: Object as () => any, required: false }
  },
  emits: ['update:visible', 'updated', 'deleted'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const visibleLocal = ref<boolean>(props.visible)
    const editEpisode = ref<string>('')
    const editEpisodeCustom = ref<string>('')
    const editStatus = ref<string>('')
    const episodeOptions = ref<{ label: string; value: string }[]>([])
    const statusOptions = ref([
      { label: 'Entrain de regarder', value: 'Entrain de regarder' },
      { label: 'Abandonner', value: 'Abandonner' },
      { label: 'Prévois de regarder', value: 'Prévois de regarder' }
    ])
    const saving = ref(false)
    const deleting = ref(false)
    const loadingEpisodes = ref(false)

    const fetchEpisodeOptions = async (idLibrary: number) => {
      episodeOptions.value = []
      loadingEpisodes.value = true
      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const resp = await fetch(`${apiBase}/chapters/${idLibrary}`)
        if (!resp.ok) return
        const rows: { chapter: string; url: string; site: string }[] = await resp.json()
        const key = (ch: string) => ch.split('.').map(Number).reduce((a, b) => a * 1000 + b, 0)
        episodeOptions.value = rows
          .sort((a, b) => key(a.chapter) - key(b.chapter))
          .map(r => ({ label: `S${r.chapter.split('.')[0]} E${r.chapter.split('.')[1]}`, value: r.chapter }))
        episodeOptions.value.push({ label: 'Manuel', value: 'manual' })
      } catch (err) {
        console.error('Erreur chargement épisodes:', err)
      } finally {
        loadingEpisodes.value = false
      }
    }

    watch(() => props.visible, (v) => {
      visibleLocal.value = v
      if (v && props.anime) {
        editEpisode.value = props.anime.userLastEpisode || props.anime.userLastChapter || props.anime.lastEpisode || props.anime.lastChapter || ''
        editEpisodeCustom.value = ''
        editStatus.value = props.anime.readingStatus || ''
        if (props.anime.id) fetchEpisodeOptions(props.anime.id)
      }
    })

    watch(visibleLocal, (v) => emit('update:visible', v))

    watch(() => props.anime, (m) => {
      if (!m) return
      editEpisode.value = m.userLastEpisode || m.userLastChapter || m.lastEpisode || m.lastChapter || ''
      editEpisodeCustom.value = ''
      editStatus.value = m.readingStatus || ''
      if (m.id) fetchEpisodeOptions(m.id)
    }, { immediate: true, deep: true })

    const close = () => {
      visibleLocal.value = false
    }

    const save = async () => {
      if (!props.anime || !authStore.user?.accessToken) return
      saving.value = true
      try {
        const chosenEpisode = editEpisode.value === 'manual' ? editEpisodeCustom.value : editEpisode.value
        const body = {
          title: props.anime.title,
          site: props.anime.site || null,
          lastChapter: chosenEpisode || null,
          readingStatus: editStatus.value || null
        }
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const resp = await fetch(`${apiBase}/library/user`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.user.accessToken}`
          },
          body: JSON.stringify(body)
        })
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ message: 'Erreur' }))
          throw new Error(err.message || 'Erreur lors de la sauvegarde')
        }

        const resJson = await resp.json().catch(() => ({}))
        // emit updated with new values so parent can update local state
        emit('updated', { idLibrary: resJson.idLibrary, lastEpisode: body.lastChapter, readingStatus: body.readingStatus })
        visibleLocal.value = false
      } catch (err) {
        console.error('Erreur sauvegarde édition anime:', err)
        alert(err instanceof Error ? err.message : 'Erreur')
      } finally {
        saving.value = false
      }
    }

    const deleteAnime = async () => {
      if (!props.anime || !authStore.user?.accessToken) return
      if (!confirm('Êtes-vous sûr de vouloir supprimer cet anime de votre bibliothèque ?')) return
      
      deleting.value = true
      try {
        const body = {
          title: props.anime.title,
          site: props.anime.site || null
        }
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const resp = await fetch(`${apiBase}/library/user`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.user.accessToken}`
          },
          body: JSON.stringify(body)
        })
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ message: 'Erreur' }))
          throw new Error(err.message || 'Erreur lors de la suppression')
        }

        // emit deleted event so parent can update state
        emit('deleted', { title: props.anime.title, site: props.anime.site })
        visibleLocal.value = false
      } catch (err) {
        console.error('Erreur suppression anime:', err)
        const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        alert(errorMsg)
      } finally {
        deleting.value = false
      }
    }

    return { visibleLocal, editEpisode, editEpisodeCustom, editStatus, episodeOptions, statusOptions, save, close, saving, deleteAnime, deleting, loadingEpisodes }
  }
})
