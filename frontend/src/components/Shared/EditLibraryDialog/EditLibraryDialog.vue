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
        <Button label="Supprimer" icon="pi pi-trash" severity="danger" text :loading="deleting" @click="deleteManga" />
        <div class="flex-grow"></div>
        <Button label="Annuler" icon="pi pi-times" text @click="close" />
        <Button :loading="saving" label="Sauvegarder" icon="pi pi-check" class="p-button-primary" @click="save" />
      </div>
    </div>
  </Dialog>
</template>

<script src="./EditLibraryDialog.ts"></script>
