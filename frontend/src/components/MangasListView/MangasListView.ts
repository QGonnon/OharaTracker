import { defineComponent, ref, onMounted } from 'vue';

interface Manga {
    id: number;
    title: string;
    status: string;
    readingStatus: string;
    rating?: number;
    lastReadChapter: number;
    latestChapter: number;
    lastReadDate: string;
    lastReleaseDate: string;
}

export default defineComponent({
    name: 'MangasListView',
    setup() {
        const mangas = ref<Manga[]>([]);
        const loading = ref(true);
        const error = ref<string | null>(null);

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

        onMounted(() => {
            fetchMangas();
        });

        return {
            mangas,
            loading,
            error,
            fetchMangas
        };
    }
});