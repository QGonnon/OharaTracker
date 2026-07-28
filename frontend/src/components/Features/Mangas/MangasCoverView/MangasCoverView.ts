import { defineComponent, onMounted, ref, computed } from "vue";
import Menu from "../../../Shared/Menu/Menu.vue";
import MangaCard from "../../../Shared/MangaCard/MangaCard.vue";
import Button from "primevue/button";
import type { Manga } from "../../../../types/index";
import mangaService from "../../../../services/manga.service";

export default defineComponent({
    components: {
        Menu,
        MangaCard,
        Button,
    },
    setup() {
        const mangas = ref<Manga[]>([]);
        const loading = ref<boolean>(true);
        const filterType = ref<'all' | 'anime' | 'lecture'>('all');

        const isAnime = (manga: Manga): boolean => mangaService.isAnimeType(manga);

        const displayedMangas = computed(() => {
            if (filterType.value === 'all') {
                return mangas.value;
            } else if (filterType.value === 'anime') {
                return mangas.value.filter(m => isAnime(m));
            } else if (filterType.value === 'lecture') {
                return mangas.value.filter(m => !isAnime(m));
            }
            return mangas.value;
        });

        const fetchMangas = async () => {
            try {
                const mangaList = await mangaService.getAll();

                // Trier par chapitre décroissant
                mangaList.sort((a, b) => (Number(b.lastChapter) || 0) - (Number(a.lastChapter) || 0));

                mangas.value = mangaList;
            } catch (error) {
                console.error("❌ Erreur lors de la récupération des mangas :", error);
            } finally {
                loading.value = false;
            }
        };

        onMounted(fetchMangas);

        return { mangas, loading, filterType, displayedMangas, isAnime };
    },
});
