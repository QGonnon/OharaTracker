<template>
  <Dialog v-model:visible="visibleLocal" header="Éditer la lecture" :closable="true" :modal="true" :style="{ width: '420px' }">
    <div class="grid gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Chapitre arrêté</label>
        <Dropdown v-model="editChapter" :options="chapterOptions" optionLabel="label" optionValue="value" placeholder="Sélectionner le chapitre" class="w-full mt-2" />
        <div v-if="editChapter === 'manual'" class="mt-2">
          <InputText v-model="editChapterCustom" placeholder="Saisir chapitre" class="w-full" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Statut de lecture</label>
        <Dropdown v-model="editStatus" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full mt-2" />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button label="Annuler" icon="pi pi-times" text @click="close" />
        <Button :loading="saving" label="Sauvegarder" icon="pi pi-check" class="p-button-primary" @click="save" />
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts">
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
  emits: ['update:visible', 'updated'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const visibleLocal = ref<boolean>(props.visible)
    const editChapter = ref<string>('')
    const editChapterCustom = ref<string>('')
    const editStatus = ref<string>('')
    const chapterOptions = ref<{ label: string; value: string }[]>([])
    const statusOptions = ref([
      { label: 'Entrain de lire', value: 'Entrain de lire' },
      { label: 'Abandonner', value: 'Abandonner' },
      { label: 'Prévois de lire', value: 'Prévois de lire' }
    ])
    const saving = ref(false)

    watch(() => props.visible, (v) => (visibleLocal.value = v))

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
    }, { immediate: true })

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

    return { visibleLocal, editChapter, editChapterCustom, editStatus, chapterOptions, statusOptions, save, close, saving }
  }
})
</script>
