<template>
  <Dialog v-model:visible="visibleLocal" :header="mangaTitle" :closable="true" :modal="true" :style="{ width: '420px' }">
    <div class="grid gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_library.stopped_chapter') }}</label>
        <Dropdown v-model="editChapter" :options="chapterOptions" optionLabel="label" optionValue="value" :placeholder="$t('edit_library.select_chapter')" class="w-full mt-2" />
        <div v-if="editChapter === 'manual'" class="mt-2">
          <InputText v-model="editChapterCustom" :placeholder="$t('edit_library.enter_chapter')" class="w-full" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_library.reading_status') }}</label>
        <Dropdown v-model="editStatus" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full mt-2" />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="$t('edit_library.delete')" icon="pi pi-trash" severity="danger" text :loading="deleting" @click="deleteManga" />
        <div class="flex-grow"></div>
        <Button :label="$t('edit_library.cancel')" icon="pi pi-times" text @click="close" />
        <Button :loading="saving" :label="$t('edit_library.save')" icon="pi pi-check" class="p-button-primary" @click="save" />
      </div>
    </div>
  </Dialog>
</template>

<script src="./EditLibraryDialog.ts"></script>
