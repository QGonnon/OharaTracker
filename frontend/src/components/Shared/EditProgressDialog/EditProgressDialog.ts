import { defineComponent, ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import Rating from 'primevue/rating'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import TagService, { type ClientTag } from '../../../services/tag.service'
import { useAuthStore } from '../../../store/auth.module'
import { useLibraryStore } from '../../../store/library.module'
import { useMangaStore } from '../../../store/manga.module'
import { editDialogConfigs } from './editDialogConfig'
import type { EditDialogRow, EditDialogType } from './editDialogConfig'

// Composant abstrait partagé par EditLibraryDialog (manga) et EditAnimeDialog (anime).
// Toute la logique commune (chargement des sources/valeurs, sauvegarde, suppression)
// vit ici ; les différences entre manga et anime sont isolées dans editDialogConfig.ts.
export default defineComponent({
  name: 'EditProgressDialog',
  components: { Dialog, Dropdown, InputText, Button, ToggleSwitch, Rating, Textarea, MultiSelect },
  props: {
    type: { type: String as () => EditDialogType, required: true },
    visible: { type: Boolean, required: true },
    item: { type: Object as () => any, required: false }
  },
  emits: ['update:visible', 'updated', 'deleted'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const authStore = useAuthStore()
    const libraryStore = useLibraryStore()
    const mangaStore = useMangaStore()
    const config = computed(() => editDialogConfigs[props.type])

    const visibleLocal = ref<boolean>(props.visible)
    const editValue = ref<string>('')
    const editValueCustom = ref<string>('')
    const editStatus = ref<string>('')
    const editSource = ref<string>('')
    const editNotify = ref<boolean>(false)
    const editScore = ref<number | null>(null)
    const editNote = ref<string>('')
    const availableTags = ref<ClientTag[]>([])
    const editTags = ref<number[]>([])
    const initialTags = ref<number[]>([])
    const newTagLabel = ref('')
    const tagError = ref('')
    const creatingTag = ref(false)
    const valueOptions = ref<{ label: string; value: string }[]>([])
    const rows = ref<EditDialogRow[]>([])
    // Les `value` sont les libellés historiques stockés en base : les traduire casserait
    // les bibliothèques existantes. Seul l'affichage suit la langue de l'interface.
    const statusOptions = computed(() => [
      { label: t('library.status.reading'), value: 'En cours' },
      { label: t('library.status.planned'), value: 'Prévus' },
      { label: t('library.status.completed'), value: 'Terminé' },
      { label: t('library.status.dropped'), value: 'Abandonné' }
    ])
    const saving = ref(false)
    const deleting = ref(false)
    const loadingValues = ref(false)

    const itemTitle = computed(() => props.item?.title || '')
    const sources = computed(() => config.value.buildSourceOptions(props.item, rows.value))

    const fetchValueOptions = async (idLibrary: number) => {
      valueOptions.value = []
      rows.value = []
      loadingValues.value = true
      try {
        const data: EditDialogRow[] = await mangaStore.getChaptersForLibrary(idLibrary)
        rows.value = data
        valueOptions.value = config.value.buildValueOptions(data, editSource.value)
      } catch (err) {
        console.error(`Erreur chargement (${props.type}):`, err)
      } finally {
        loadingValues.value = false
      }
    }

    watch(editSource, (source) => {
      if (config.value.filterOptionsOnSourceChange && rows.value.length > 0) {
        valueOptions.value = config.value.buildValueOptions(rows.value, source)
        const validValues = valueOptions.value.map(o => o.value)
        if (editValue.value && !validValues.includes(editValue.value)) {
          editValue.value = ''
        }
      }
    })

    const loadTags = async (idLibrary?: number) => {
      const token = authStore.user?.accessToken
      if (!token) return

      try {
        const { tags } = await TagService.list(token)
        availableTags.value = tags
        const applied = idLibrary ? tags.filter(tag => tag.works.includes(idLibrary)).map(tag => tag.id) : []
        editTags.value = [...applied]
        initialTags.value = [...applied]
      } catch {
        availableTags.value = []
      }
    }

    const createTag = async () => {
      const token = authStore.user?.accessToken
      const label = newTagLabel.value.trim()
      if (!token || !label) return

      creatingTag.value = true
      tagError.value = ''
      try {
        const tag = await TagService.create(token, label)
        availableTags.value = [...availableTags.value, tag].sort((a, b) => a.label.localeCompare(b.label))
        editTags.value = [...editTags.value, tag.id]
        newTagLabel.value = ''
      } catch (err) {
        tagError.value = err instanceof Error ? err.message : 'Erreur'
      } finally {
        creatingTag.value = false
      }
    }

    // Les (dé)associations ne sont poussées qu'à l'enregistrement, comme le reste du formulaire.
    const persistTags = async (idLibrary: number) => {
      const token = authStore.user?.accessToken
      if (!token) return

      const added = editTags.value.filter(id => !initialTags.value.includes(id))
      const removed = initialTags.value.filter(id => !editTags.value.includes(id))

      await Promise.all([
        ...added.map(id => TagService.assign(token, id, idLibrary)),
        ...removed.map(id => TagService.unassign(token, id, idLibrary)),
      ])
      initialTags.value = [...editTags.value]
    }

    const resetFromItem = (item: any) => {
      editValue.value = config.value.getInitialValue(item)
      editValueCustom.value = ''
      editStatus.value = item.readingStatus || ''
      editSource.value = config.value.getInitialSource(item)
      editNotify.value = !!item.notifyEnabled
      editScore.value = item.score === null || item.score === undefined ? null : Number(item.score)
      editNote.value = item.note ?? ''
      newTagLabel.value = ''
      tagError.value = ''
      loadTags(item.id)
      if (item.id) fetchValueOptions(item.id)
    }

    watch(() => props.visible, (v) => {
      visibleLocal.value = v
      if (v && props.item) resetFromItem(props.item)
    })

    watch(visibleLocal, (v) => emit('update:visible', v))

    watch(() => props.item, (item) => {
      if (!item) return
      resetFromItem(item)
    }, { immediate: true, deep: true })

    const close = () => {
      visibleLocal.value = false
    }

    const save = async () => {
      if (!props.item || !authStore.user?.accessToken) return
      saving.value = true
      try {
        const chosenValue = editValue.value === 'manual' ? editValueCustom.value : editValue.value
        const body = {
          ...config.value.buildSaveBody(props.item, editSource.value, chosenValue, editStatus.value, editNotify.value),
          score: editScore.value,
          note: editNote.value.trim() || null,
        }
        const resJson = await libraryStore.updateLibraryEntry(body)
        if (props.item.id) await persistTags(props.item.id)
        emit('updated', { ...config.value.buildUpdatedPayload(resJson, body), score: body.score, note: body.note })
        visibleLocal.value = false
      } catch (err) {
        console.error(`Erreur sauvegarde édition (${props.type}):`, err)
        alert(err instanceof Error ? err.message : 'Erreur')
      } finally {
        saving.value = false
      }
    }

    const deleteItem = async () => {
      if (!props.item || !authStore.user?.accessToken) return
      if (!confirm(config.value.deleteConfirmText)) return

      deleting.value = true
      try {
        const body = config.value.buildDeleteBody(props.item, editSource.value)
        await libraryStore.deleteFromLibrary(body)

        emit('deleted', { title: props.item.title, site: body.site })
        visibleLocal.value = false
      } catch (err) {
        console.error(`Erreur suppression (${props.type}):`, err)
        const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        alert(errorMsg)
      } finally {
        deleting.value = false
      }
    }

    return {
      config,
      visibleLocal,
      editValue,
      editValueCustom,
      editStatus,
      editSource,
      editNotify,
      editScore,
      editNote,
      availableTags,
      editTags,
      newTagLabel,
      tagError,
      creatingTag,
      createTag,
      valueOptions,
      statusOptions,
      save,
      close,
      saving,
      deleteItem,
      deleting,
      loadingValues,
      itemTitle,
      sources
    }
  }
})
