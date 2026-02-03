import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import Menu from '../../../Common/Menu/Menu.vue'
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
import EditAnimeDialog from '../../../Shared/EditLibraryDialog/EditAnimeDialog.vue'
import { useAuthStore } from '../../../../store/auth.module'
import type { Manga } from '../../../../types/index'

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
        const router = useRouter()
        const route = useRoute()
        const authStore = useAuthStore()
        const mangas = ref<Manga[]>([]);
        const loading = ref(true);
        const error = ref<string | null>(null);
        const searchQuery = ref('');
        const viewMode = ref<'list' | 'grid'>('list');
        const filterType = ref<'all' | 'anime' | 'lecture'>('all');

        const filteredMangas = computed(() => {
            if (!searchQuery.value) return mangas.value;
            return mangas.value.filter(manga =>
                manga.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                manga.author?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                manga.site?.toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });

        const displayedMangas = computed(() => {
            const list = (filteredMangas.value || []).slice();
            if (filterType.value === 'anime') {
                return list.filter((i: any) => (i.type || 'Manga') === 'Anime');
            }
            if (filterType.value === 'lecture') {
                return list.filter((i: any) => (i.type || 'Manga') !== 'Anime');
            }
            return list;
        });

        const fetchMangas = async () => {
            try {
                loading.value = true;
                error.value = null;
                
                if (!authStore.isLoggedIn || !authStore.user?.accessToken) {
                    await router.push('/login')
                    return
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/library/user`, {
                    headers: {
                        Authorization: `Bearer ${authStore.user.accessToken}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                // Detect type (Manga/Anime) based on known source names
                const animeSources = new Set(['anilist', 'asura']);
                mangas.value = (data || []).map((item: any) => {
                    const site = (item.site || '').toLowerCase();
                    const type = animeSources.has(site) ? 'Anime' : 'Manga';
                    return { ...item, type };
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
            // Ouvrir le bon dialog selon le type
            if ((data.type || 'Manga') === 'Anime') {
                editAnimeDialog.value = true;
            } else {
                editDialog.value = true;
            }
        };

        const onDialogUpdated = (payload: any) => {
            if (!editingManga.value) return;
            const idx = mangas.value.findIndex(m => String(m.id) === String(editingManga.value?.id));
            if (idx >= 0) {
                // Handle both lastChapter (manga) and lastEpisode (anime)
                if (payload?.lastChapter !== undefined) mangas.value[idx].userLastChapter = payload.lastChapter
                if (payload?.lastEpisode !== undefined) mangas.value[idx].userLastEpisode = payload.lastEpisode
                if (payload?.readingStatus !== undefined) mangas.value[idx].readingStatus = payload.readingStatus
                // Synchronize editingManga with updated data for next edit
                editingManga.value = mangas.value[idx];
            }
            editDialog.value = false
            editAnimeDialog.value = false
        };

        const openChapter = (url: string) => {
            window.open(url, '_blank');
        };

        const getCoverUrl = (manga: Manga): string => {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            if (manga.coverPath) {
                return `${apiBase}/cdn/${manga.coverPath}`;
            }
            if (manga.coverUrl) return manga.coverUrl;
            // fallback image similar to Search component
            return `https://picsum.photos/seed/${manga.id}/400/600`;
        };

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
            onDialogUpdated
        };
    }
});
