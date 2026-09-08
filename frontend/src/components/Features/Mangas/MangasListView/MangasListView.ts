import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import Menu from '../../../Shared/Menu/Menu.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import EditLibraryDialog from '../../../Shared/EditLibraryDialog/EditLibraryDialog.vue'
import EditAnimeDialog from '../../../Shared/EditAnimeDialog/EditAnimeDialog.vue'
import { useAuthStore } from '../../../../store/auth.module'
import { useMangaStore } from '../../../../store/manga.module'
import { useLibraryStore } from '../../../../store/library.module'
import type { Manga } from '../../../../types/index'
import { slugify } from '../../../../utils'
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
    name: 'MangasListView',
    components: {
        Menu,
        Card,
        Button,
        Tag,
        DataTable,
        Column,
        EditLibraryDialog,
        EditAnimeDialog,
        InputIcon,
        IconField,
        InputText,
        Message,
    },
    setup() {
      usePageSeo('library', { noindex: true });
        const router = useRouter()
        const route = useRoute()
        const authStore = useAuthStore()
        const mangaStore = useMangaStore()
        const libraryStore = useLibraryStore()
        const mangas = ref<Manga[]>([]);
        const clientInfo = ref<Record<string, any> | null>(null);
        const loading = ref(true);
        const error = ref<string | null>(null);
        const searchQuery = ref('');
        const viewMode = ref<'list' | 'grid'>('list');
        const filterType = ref<'all' | 'anime' | 'lecture'>('all');

        const filteredMangas = computed(() => {
            if (!searchQuery.value) return mangas.value;
            const q = searchQuery.value.toLowerCase();
            return mangas.value.filter(manga =>
                manga.title?.toLowerCase().includes(q) ||
                manga.author?.toLowerCase().includes(q) ||
                Object.keys(manga.sites || {}).some(s => s.toLowerCase().includes(q))
            );
        });

        const displayedMangas = computed(() => {
            const list = (filteredMangas.value || []).slice();
            if (filterType.value === 'anime') {
                return list.filter(m => mangaStore.isAnimeType(m));
            }
            if (filterType.value === 'lecture') {
                return list.filter(m => !mangaStore.isAnimeType(m));
            }
            return list;
        });

        // force=true (bouton "recharger") bypasse le cache des stores pour un vrai refresh
        const fetchMangas = async (force = false) => {
            try {
                loading.value = true;
                error.value = null;

                if (!authStore.isLoggedIn || !authStore.user?.accessToken) {
                    await router.push({ name: 'Login' });
                    return;
                }

                const [client, mangaList] = await Promise.all([
                    libraryStore.fetchClientInfo(force),
                    mangaStore.fetchAll(force),
                ]);

                clientInfo.value = client;
                const mangaById = new Map(mangaList.map(m => [m.id, m]));

                mangas.value = (clientInfo.value?.libraryUsage ?? []).map((u: any): Manga => {
                    const lib = mangaById.get(u.libraryId) ?? ({} as Manga);
                    const { chapter: lastChapter, chapterUrl } = mangaStore.getLastChapterInfo(lib);

                    return {
                        id: u.libraryId,
                        title: lib.title ?? '',
                        type: lib.type ?? '',
                        theme: lib.theme ?? '',
                        status: lib.status ?? '',
                        description: lib.description ?? '',
                        author: lib.author ?? '',
                        artist: lib.artist ?? '',
                        coverPath: lib.coverPath ?? '',
                        coverUrl: lib.coverUrl ?? '',
                        sites: lib.sites ?? {},
                        lastChapter,
                        chapterUrl,
                        userLastChapter: u.lastReadChapter ?? undefined,
                        readingStatus: u.readingStatus ?? undefined,
                        score: u.clientScore ?? null,
                        note: u.clientNote ?? null,
                    };
                });
            } catch (err) {
                error.value = err instanceof Error ? err.message : 'Une erreur est survenue';
                console.error('Erreur lors du chargement des mangas:', err);
            } finally {
                loading.value = false;
            }
        };

        // Édition utilisateur (deux dialogs différents selon le type)
        const editDialog = ref(false);
        const editAnimeDialog = ref(false);
        const editingManga = ref<Manga | null>(null);

        const openEdit = (data: Manga) => {
            editingManga.value = data;
            console.log('Ouverture édition manga:', data);
            // Ouvrir le bon dialog selon le type
            if (mangaStore.isAnimeType(data)) {
                editAnimeDialog.value = true;
            } else {
                editDialog.value = true;
            }
        };

        const onDialogUpdated = (payload: any) => {
            if (!editingManga.value) return;
            const idx = mangas.value.findIndex(m => m.id === editingManga.value?.id);
            if (idx >= 0) {
                if (payload?.lastChapter !== undefined) mangas.value[idx].userLastChapter = payload.lastChapter;
                if (payload?.readingStatus !== undefined) mangas.value[idx].readingStatus = payload.readingStatus;
                editingManga.value = mangas.value[idx];
            }
            editDialog.value = false;
            editAnimeDialog.value = false;
        };

        const onDialogDeleted = () => {
            if (!editingManga.value) return;
            mangas.value = mangas.value.filter(m => m.id !== editingManga.value?.id);
            editingManga.value = null;
            editDialog.value = false;
            editAnimeDialog.value = false;
        };

        const openChapter = (url: string) => {
            window.open(url, '_blank');
        };

        const navigateToInfo = (manga: Manga) => {
            const routeName = mangaStore.isAnimeType(manga) ? 'AnimeInfo' : 'MangaInfo';
            router.push({ name: routeName, params: { name: slugify(manga.title) } });
        };

        const getCoverUrl = (manga: Manga): string => mangaStore.getCoverUrl(manga);

        onMounted(async () => {
            await fetchMangas();
            const q = route.query.editId
            if (q) {
                const idToEdit = Number(q)
                const found = mangas.value.find(m => Number(m.id) === idToEdit)
                if (found) openEdit(found)
            }
        });

        return {
            mangas,
            clientInfo,
            filteredMangas,
            displayedMangas,
            filterType,
            loading,
            error,
            searchQuery,
            viewMode,
            fetchMangas,
            openChapter,
            getCoverUrl,
            // edit bindings
            editDialog,
            editAnimeDialog,
            editingManga,
            openEdit,
            onDialogUpdated,
            onDialogDeleted,
            navigateToInfo,
        };
    }
});
