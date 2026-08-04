<template>
  <Dialog v-model:visible="visibleLocal" :header="animeTitle" :closable="true" :modal="true" :style="{ width: '420px' }">
    <div class="grid gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_anime.source') }}</label>
        <Dropdown
          v-model="editSource"
          :options="animeSources"
          optionLabel="site"
          optionValue="site"
          :placeholder="loadingEpisodes ? $t('edit_anime.loading_sources') : $t('edit_anime.select_source')"
          :disabled="loadingEpisodes"
          class="w-full mt-2"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_anime.stopped_episode') }}</label>
        <Dropdown v-model="editEpisode" :options="episodeOptions" optionLabel="label" optionValue="value" :placeholder="loadingEpisodes ? $t('edit_anime.loading_episodes') : $t('edit_anime.select_episode')" :disabled="loadingEpisodes" class="w-full mt-2" />
        <div v-if="editEpisode === 'manual'" class="mt-2">
          <InputText v-model="editEpisodeCustom" :placeholder="$t('edit_anime.enter_episode')" class="w-full" />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_anime.viewing_status') }}</label>
        <Dropdown v-model="editStatus" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full mt-2" />
      </div>
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ $t('edit_anime.notify') }}</label>
        <ToggleSwitch v-model="editNotify" />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button :label="$t('edit_anime.delete')" icon="pi pi-trash" severity="danger" text :loading="deleting" @click="deleteAnime" />
        <div class="flex-grow"></div>
        <Button :label="$t('edit_anime.cancel')" icon="pi pi-times" text @click="close" />
        <Button :loading="saving" :label="$t('edit_anime.save')" icon="pi pi-check" class="p-button-primary" @click="save" />
      </div>
    </div>
  </Dialog>
</template>

<script src="./EditAnimeDialog.ts"></script>
