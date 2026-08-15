import { defineComponent, ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
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
  components: { Dialog, Dropdown, InputText, Button, ToggleSwitch },
  props: {
    type: { type: String as () => EditDialogType, required: true },
    visible: { type: Boolean, required: true },
    item: { type: Object as () => any, required: false }
  },
  emits: ['update:visible', 'updated', 'deleted'],
  setup(props, { emit }) {
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
    const valueOptions = ref<{ label: string; value: string }[]>([])
    const rows = ref<EditDialogRow[]>([])
    const statusOptions = ref([
      { label: 'En cours', value: 'En cours' },
      { label: 'Abandonné', value: 'Abandonné' },
      { label: 'Prévus', value: 'Prévus' }
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

    const resetFromItem = (item: any) => {
      editValue.value = config.value.getInitialValue(item)
      editValueCustom.value = ''
      editStatus.value = item.readingStatus || ''
      editSource.value = config.value.getInitialSource(item)
      editNotify.value = !!item.notifyEnabled
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
        const body = config.value.buildSaveBody(props.item, editSource.value, chosenValue, editStatus.value, editNotify.value)
        const resJson = await libraryStore.updateLibraryEntry(body)
        emit('updated', config.value.buildUpdatedPayload(resJson, body))
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
