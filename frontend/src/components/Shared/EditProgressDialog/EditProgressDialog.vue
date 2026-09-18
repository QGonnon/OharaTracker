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
