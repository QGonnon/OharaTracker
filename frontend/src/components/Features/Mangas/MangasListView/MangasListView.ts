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

        const filteredMangas = computed(() => {
            if (!searchQuery.value) return mangas.value;
            return mangas.value.filter(manga =>
                manga.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                manga.author?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                manga.site?.toLowerCase().includes(searchQuery.value.toLowerCase())
            );
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
                mangas.value = data;
            } catch (err) {
                error.value = err instanceof Error ? err.message : 'Une erreur est survenue';
                console.error('Erreur lors du chargement des mangas:', err);
            } finally {
                loading.value = false;
            }
        };

        // Édition utilisateur (centralisé)
        const editDialog = ref(false);
        const editingManga = ref<Manga | null>(null);

        const openEdit = (data: Manga) => {
            editingManga.value = data;
            editDialog.value = true;
        };

        const onDialogUpdated = (payload: any) => {
            if (!editingManga.value) return;
            const idx = mangas.value.findIndex(m => String(m.id) === String(editingManga.value?.id));
            if (idx >= 0) {
                if (payload?.lastChapter !== undefined) mangas.value[idx].userLastChapter = payload.lastChapter
                if (payload?.readingStatus !== undefined) mangas.value[idx].readingStatus = payload.readingStatus
            }
            editDialog.value = false
        };

        const openChapter = (url: string) => {
            window.open(url, '_blank');
        };

        const getCoverUrl = (manga: Manga): string => {
            const apiBase = import.meta.env.VITE_API_URL;
            if (manga.coverPath) {
                return `${apiBase}/cdn/${manga.coverPath}`;
            }
            if (manga.coverUrl) return manga.coverUrl;
            return '';
        };

        onMounted(() => {
            fetchMangas().then(() => {
                const q = route.query.editId
                if (q) {
                    const idToEdit = Number(q)
                    const found = mangas.value.find(m => Number(m.id) === idToEdit)
                    if (found) openEdit(found)
                }
            })
        });

        return {
            mangas,
            filteredMangas,
            loading,
            error,
            searchQuery,
            viewMode,
            fetchMangas,
            openChapter,
            getCoverUrl,
            // edit bindings
            editDialog,
            editingManga,
            openEdit,
            onDialogUpdated
        };
    }
});
