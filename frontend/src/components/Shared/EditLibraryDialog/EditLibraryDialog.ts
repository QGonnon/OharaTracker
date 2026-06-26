import { defineComponent, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useAuthStore } from '../../../store/auth.module'

export default defineComponent({
  name: 'EditLibraryDialog',
  components: { Dialog, Dropdown, InputText, Button },
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
    const chapterOptions = ref<{ label: string; value: string }[]>([])
    const statusOptions = ref([
      { label: 'En cours', value: 'En cours' },
      { label: 'Abandonné', value: 'Abandonné' },
      { label: 'Prévus', value: 'Prévus' }
    ])
    const saving = ref(false)
    const deleting = ref(false)

    watch(() => props.visible, (v) => {
      visibleLocal.value = v
      // When dialog opens, refresh the form fields with current manga data
      if (v && props.manga) {
        editChapter.value = props.manga.userLastChapter || props.manga.lastChapter || ''
        editChapterCustom.value = ''
        editStatus.value = props.manga.readingStatus || ''
        buildChapterOptions()
      }
    })

    watch(visibleLocal, (v) => emit('update:visible', v))

    const buildChapterOptions = () => {
      chapterOptions.value = []
      const last = Number(props.manga?.lastChapter)
      if (!Number.isFinite(last) || last <= 0) return
      for (let i = 1; i <= last; i++) {
        chapterOptions.value.push({ label: `Ch. ${i}`, value: String(i) })
      }
      chapterOptions.value.push({ label: 'Manuel', value: 'manual' })
    }

    watch(() => props.manga, (m) => {
      if (!m) return
      editChapter.value = m.userLastChapter || m.lastChapter || ''
      editChapterCustom.value = ''
      editStatus.value = m.readingStatus || ''
      buildChapterOptions()
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
          site: props.manga.site || null,
          lastChapter: chosenChapter || null,
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
        emit('updated', { idLibrary: resJson.idLibrary, lastChapter: body.lastChapter, readingStatus: body.readingStatus })
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
          site: props.manga.site || null
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
        emit('deleted', { title: props.manga.title, site: props.manga.site })
        visibleLocal.value = false
      } catch (err) {
        console.error('Erreur suppression manga:', err)
        const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        alert(errorMsg)
      } finally {
        deleting.value = false
      }
    }

    return { visibleLocal, editChapter, editChapterCustom, editStatus, chapterOptions, statusOptions, save, close, saving, deleteManga, deleting }
  }
})
