import { defineComponent, ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import { useAuthStore } from '../../../store/auth.module'

export default defineComponent({
  name: 'EditLibraryDialog',
  components: { Dialog, Dropdown, InputText, Button, ToggleSwitch },
  props: {
    visible: { type: Boolean, required: true },
    manga: { type: Object as () => any, required: false }
  },
  emits: ['update:visible', 'updated', 'deleted'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const visibleLocal = ref<boolean>(props.visible)
    const editChapter = ref<string>('')
    const editChapterCustom = ref<string>('')
    const editStatus = ref<string>('')
    const editSource = ref<string>('')
    const editNotify = ref<boolean>(false)
    const chapterOptions = ref<{ label: string; value: string }[]>([])
    const chapterRows = ref<{ chapter: string; url: string; site: string }[]>([])
    const statusOptions = ref([
      { label: 'En cours', value: 'En cours' },
      { label: 'Abandonné', value: 'Abandonné' },
      { label: 'Prévus', value: 'Prévus' }
    ])
    const saving = ref(false)
    const deleting = ref(false)
    const loadingChapters = ref(false)

    const mangaTitle = computed(() => props.manga?.title || '')

    const mangaSources = computed((): { site: string; mangaUrl: string; chapters: any[] }[] => {
      const sites = props.manga?.sites
      if (!sites) return []
      return Object.values(sites) as { site: string; mangaUrl: string; chapters: any[] }[]
    })

    const buildChapterOptions = (rows: { chapter: string; url: string; site: string }[], source: string) => {
      const filtered = source ? rows.filter(r => r.site === source) : rows
      const key = (ch: string) => Number(ch)
      const options = [...new Map(filtered.map(r => [r.chapter, r])).values()]
        .sort((a, b) => key(a.chapter) - key(b.chapter))
        .map(r => ({ label: `Ch. ${r.chapter}`, value: r.chapter }))
      options.push({ label: 'Manuel', value: 'manual' })
      return options
    }

    const fetchChapterOptions = async (idLibrary: number) => {
      chapterOptions.value = []
      chapterRows.value = []
      loadingChapters.value = true
      try {
        const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`
        const resp = await fetch(`${apiBase}/chapters/${idLibrary}`)
        if (!resp.ok) return
        const rows: { chapter: string; url: string; site: string }[] = await resp.json()
        chapterRows.value = rows
        chapterOptions.value = buildChapterOptions(rows, editSource.value)
      } catch (err) {
        console.error('Erreur chargement chapitres:', err)
      } finally {
        loadingChapters.value = false
      }
    }

    watch(editSource, (source) => {
      if (chapterRows.value.length > 0) {
        chapterOptions.value = buildChapterOptions(chapterRows.value, source)
        const validValues = chapterOptions.value.map(o => o.value)
        if (editChapter.value && !validValues.includes(editChapter.value)) {
          editChapter.value = ''
        }
      }
    })

    watch(() => props.visible, (v) => {
      visibleLocal.value = v
      if (v && props.manga) {
        editChapter.value = props.manga.userLastChapter || props.manga.lastChapter || ''
        editChapterCustom.value = ''
        editStatus.value = props.manga.readingStatus || ''
        editSource.value = props.manga.site || ''
        editNotify.value = !!props.manga.notifyEnabled
        if (props.manga.id) fetchChapterOptions(props.manga.id)
      }
    })

    watch(visibleLocal, (v) => emit('update:visible', v))

    watch(() => props.manga, (m) => {
      if (!m) return
      editChapter.value = m.userLastChapter || m.lastChapter || ''
      editChapterCustom.value = ''
      editStatus.value = m.readingStatus || ''
      editSource.value = m.site || ''
      editNotify.value = !!m.notifyEnabled
      if (m.id) fetchChapterOptions(m.id)
    }, { immediate: true, deep: true })

    const close = () => {
      visibleLocal.value = false
    }

    const save = async () => {
      if (!props.manga || !authStore.user?.accessToken) return
      saving.value = true
      try {
        const chosenChapter = editChapter.value === 'manual' ? editChapterCustom.value : editChapter.value
        const body = {
          title: props.manga.title,
          site: editSource.value || props.manga.site || null,
          lastChapter: chosenChapter || null,
          readingStatus: editStatus.value || null,
          notifyEnabled: editNotify.value
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
        emit('updated', { idLibrary: resJson.idLibrary, lastChapter: body.lastChapter, readingStatus: body.readingStatus, site: body.site, notifyEnabled: body.notifyEnabled })
        visibleLocal.value = false
      } catch (err) {
        console.error('Erreur sauvegarde édition (shared):', err)
        alert(err instanceof Error ? err.message : 'Erreur')
      } finally {
        saving.value = false
      }
    }

    const deleteManga = async () => {
      if (!props.manga || !authStore.user?.accessToken) return
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce manga de votre bibliothèque ?')) return

      deleting.value = true
      try {
        const body = {
          title: props.manga.title,
          site: editSource.value || props.manga.site || null
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

        emit('deleted', { title: props.manga.title, site: editSource.value || props.manga.site })
        visibleLocal.value = false
      } catch (err) {
        console.error('Erreur suppression manga:', err)
        const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        alert(errorMsg)
      } finally {
        deleting.value = false
      }
    }

    return { visibleLocal, editChapter, editChapterCustom, editStatus, editSource, editNotify, chapterOptions, statusOptions, save, close, saving, deleteManga, deleting, loadingChapters, mangaTitle, mangaSources }
  }
})
