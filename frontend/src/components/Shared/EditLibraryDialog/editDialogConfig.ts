// Configuration partagée entre EditLibraryDialog (manga) et EditAnimeDialog (anime).
// Chaque type définit sa propre logique (options, libellés i18n, corps des requêtes)
// pour permettre au composant abstrait EditProgressDialog de rester générique.

export type EditDialogType = 'manga' | 'anime'

export interface EditDialogRow {
  chapter: string
  url: string
  site: string
}

export interface EditDialogOption {
  label: string
  value: string
}

export interface EditDialogLabels {
  source: string
  selectSource: string
  loadingSources: string
  stoppedValue: string
  status: string
  selectValue: string
  loadingValues: string
  enterValue: string
  notify: string
  delete: string
  cancel: string
  save: string
}

export interface EditDialogConfig {
  /** Préfixe legacy conservé pour référence (les clés i18n complètes sont dans `labels`). */
  i18nPrefix: string
  labels: EditDialogLabels
  deleteConfirmText: string
  getInitialValue(item: any): string
  getInitialSource(item: any): string
  buildSourceOptions(item: any, rows: EditDialogRow[]): { site: string }[]
  buildValueOptions(rows: EditDialogRow[], source: string): EditDialogOption[]
  /** Si true, les options sont recalculées quand la source sélectionnée change. */
  filterOptionsOnSourceChange: boolean
  buildSaveBody(item: any, source: string, chosenValue: string, status: string, notify: boolean): Record<string, any>
  buildUpdatedPayload(resJson: any, body: Record<string, any>): Record<string, any>
  buildDeleteBody(item: any, source: string): Record<string, any>
}

const buildMangaValueOptions = (rows: EditDialogRow[], source: string): EditDialogOption[] => {
  const filtered = source ? rows.filter(r => r.site === source) : rows
  const key = (ch: string) => Number(ch)
  const options = [...new Map(filtered.map(r => [r.chapter, r])).values()]
    .sort((a, b) => key(a.chapter) - key(b.chapter))
    .map(r => ({ label: `Ch. ${r.chapter}`, value: r.chapter }))
  options.push({ label: 'Manuel', value: 'manual' })
  return options
}

const buildAnimeValueOptions = (rows: EditDialogRow[]): EditDialogOption[] => {
  const key = (ch: string) => ch.split('.').map(Number).reduce((a, b) => a * 1000 + b, 0)
  const options = [...rows]
    .sort((a, b) => key(a.chapter) - key(b.chapter))
    .map(r => ({ label: `S${r.chapter.split('.')[0]} E${r.chapter.split('.')[1]}`, value: r.chapter }))
  options.push({ label: 'Manuel', value: 'manual' })
  return options
}

export const editDialogConfigs: Record<EditDialogType, EditDialogConfig> = {
  manga: {
    i18nPrefix: 'edit_library',
    labels: {
      source: 'edit_library.source',
      selectSource: 'edit_library.select_source',
      loadingSources: 'edit_library.loading_sources',
      stoppedValue: 'edit_library.stopped_chapter',
      status: 'edit_library.reading_status',
      selectValue: 'edit_library.select_chapter',
      loadingValues: 'edit_library.loading_chapters',
      enterValue: 'edit_library.enter_chapter',
      notify: 'edit_library.notify',
      delete: 'edit_library.delete',
      cancel: 'edit_library.cancel',
      save: 'edit_library.save'
    },
    deleteConfirmText: 'Êtes-vous sûr de vouloir supprimer ce manga de votre bibliothèque ?',
    getInitialValue: (item) => item?.userLastChapter || item?.lastChapter || '',
    getInitialSource: (item) => item?.site || '',
    buildSourceOptions: (item) => (item?.sites ? Object.values(item.sites) : []) as { site: string }[],
    buildValueOptions: buildMangaValueOptions,
    filterOptionsOnSourceChange: true,
    buildSaveBody: (item, source, chosenValue, status, notify) => ({
      title: item.title,
      site: source || item.site || null,
      lastChapter: chosenValue || null,
      readingStatus: status || null,
      notifyEnabled: notify
    }),
    buildUpdatedPayload: (resJson, body) => ({
      idLibrary: resJson.idLibrary,
      lastChapter: body.lastChapter,
      readingStatus: body.readingStatus,
      site: body.site,
      notifyEnabled: body.notifyEnabled
    }),
    buildDeleteBody: (item, source) => ({ title: item.title, site: source || item.site || null })
  },
  anime: {
    i18nPrefix: 'edit_anime',
    labels: {
      source: 'edit_anime.source',
      selectSource: 'edit_anime.select_source',
      loadingSources: 'edit_anime.loading_sources',
      stoppedValue: 'edit_anime.stopped_episode',
      status: 'edit_anime.viewing_status',
      selectValue: 'edit_anime.select_episode',
      loadingValues: 'edit_anime.loading_episodes',
      enterValue: 'edit_anime.enter_episode',
      notify: 'edit_anime.notify',
      delete: 'edit_anime.delete',
      cancel: 'edit_anime.cancel',
      save: 'edit_anime.save'
    },
    deleteConfirmText: 'Êtes-vous sûr de vouloir supprimer cet anime de votre bibliothèque ?',
    getInitialValue: (item) => item?.userLastEpisode || item?.userLastChapter || item?.lastEpisode || item?.lastChapter || '',
    getInitialSource: () => '',
    buildSourceOptions: (_item, rows) => {
      const seen = new Set<string>()
      return rows.filter(r => {
        if (seen.has(r.site)) return false
        seen.add(r.site)
        return true
      })
    },
    buildValueOptions: buildAnimeValueOptions,
    filterOptionsOnSourceChange: false,
    buildSaveBody: (item, _source, chosenValue, status, notify) => ({
      title: item.title,
      site: item.site || null,
      lastChapter: chosenValue || null,
      readingStatus: status || null,
      notifyEnabled: notify
    }),
    buildUpdatedPayload: (resJson, body) => ({
      idLibrary: resJson.idLibrary,
      lastEpisode: body.lastChapter,
      readingStatus: body.readingStatus,
      notifyEnabled: body.notifyEnabled
    }),
    buildDeleteBody: (item) => ({ title: item.title, site: item.site || null })
  }
}
