import { defineComponent, ref, onMounted, computed } from 'vue';
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
        InputIcon,
        IconField,
        InputText,
        Message,
    },
    setup() {
        const mangas = ref<Manga[]>([]);
        const loading = ref(true);
        const error = ref<string | null>(null);
        const searchQuery = ref('');

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
                
                const response = await fetch(`${import.meta.env.VITE_API_URL}/chapters`);
                
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

        const openChapter = (url: string) => {
            window.open(url, '_blank');
        };

        onMounted(() => {
            fetchMangas();
        });

        return {
            mangas,
            filteredMangas,
            loading,
            error,
            searchQuery,
            fetchMangas,
            openChapter
        };
    }
});
