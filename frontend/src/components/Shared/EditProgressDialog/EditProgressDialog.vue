<template>
  <Dialog v-model:visible="visibleLocal" :header="itemTitle" :closable="true" :modal="true" :style="{ width: '420px' }" dismissableMask>
    <div class="grid gap-4">
      <div>
        <label for="edit-source" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t(config.labels.source) }}</label>
        <Dropdown
          inputId="edit-source"
          v-model="editSource"
          :options="sources"
          optionLabel="site"
          optionValue="site"
          :placeholder="loadingValues ? $t(config.labels.loadingSources) : $t(config.labels.selectSource)"
          :disabled="loadingValues"
          class="w-full mt-2"
        />
      </div>
      <div>
        <label for="edit-value" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t(config.labels.stoppedValue) }}</label>
        <Dropdown inputId="edit-value" v-model="editValue" :options="valueOptions" optionLabel="label" optionValue="value" :placeholder="loadingValues ? $t(config.labels.loadingValues) : $t(config.labels.selectValue)" :disabled="loadingValues" class="w-full mt-2" />
        <div v-if="editValue === 'manual'" class="mt-2">
          <label for="edit-value-custom" class="sr-only">{{ $t(config.labels.enterValue) }}</label>
          <InputText id="edit-value-custom" v-model="editValueCustom" :placeholder="$t(config.labels.enterValue)" class="w-full" />
        </div>
      </div>

      <div>
        <label for="edit-status" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t(config.labels.status) }}</label>
        <Dropdown inputId="edit-status" v-model="editStatus" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full mt-2" />
      </div>
      <div>
        <label for="edit-score" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_library.score') }}</label>
        <Rating inputId="edit-score" v-model="editScore" :stars="10" class="mt-2" />
      </div>

      <div>
        <label for="edit-tags" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_library.tags') }}</label>
        <MultiSelect
          inputId="edit-tags"
          v-model="editTags"
          :options="availableTags"
          optionLabel="label"
          optionValue="id"
          :placeholder="$t('edit_library.tags_placeholder')"
          :showToggleAll="false"
          display="chip"
          class="w-full mt-2"
        />
        <div class="flex gap-2 mt-2">
          <InputText
            v-model="newTagLabel"
            :placeholder="$t('edit_library.new_tag')"
            maxlength="30"
            class="flex-1"
            @keyup.enter="createTag"
          />
          <Button
            :label="$t('edit_library.add_tag')"
            icon="pi pi-plus"
            text
            :loading="creatingTag"
            :disabled="!newTagLabel.trim()"
            @click="createTag"
          />
        </div>
        <p v-if="tagError" role="alert" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ tagError }}</p>
      </div>

      <div>
        <label for="edit-note" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_library.note') }}</label>
        <Textarea id="edit-note" v-model="editNote" rows="3" maxlength="2000" :placeholder="$t('edit_library.note_placeholder')" class="w-full mt-2" />
      </div>

      <div class="flex items-center justify-between">
        <label for="edit-notify" class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t(config.labels.notify) }}</label>
        <ToggleSwitch inputId="edit-notify" v-model="editNotify" />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="$t(config.labels.delete)" icon="pi pi-trash" severity="danger" text :loading="deleting" @click="deleteItem" />
        <div class="flex-grow"></div>
        <Button :loading="saving" :label="$t(config.labels.save)" icon="pi pi-check" class="p-button-primary" @click="save" />
      </div>
    </div>
  </Dialog>
</template>

<script src="./EditProgressDialog.ts"></script>
