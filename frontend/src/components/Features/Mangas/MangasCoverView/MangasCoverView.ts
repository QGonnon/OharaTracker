import { defineComponent, onMounted, ref } from "vue";
import Menu from "../../../Common/Menu/Menu.vue";
import MangaCard from "../../../Shared/MangaCard/MangaCard.vue";
import type { Manga } from "../../../../types/index";

export default defineComponent({
    components: {
        Menu,
        MangaCard,
    },
    setup() {
        const mangas = ref<Manga[]>([]);
        const loading = ref<boolean>(true);

        const fetchMangas = async () => {
            const chapterUrl = `${import.meta.env.VITE_API_URL}/chapters`;

            try {
                const response = await fetch(chapterUrl);
                const chapters = await response.json() || [];
                
                const mangaList: Manga[] = chapters.map((chapter: any) => ({
                    id: chapter.chapterId,
                    title: chapter.title,
                    author: chapter.author,
                    theme: chapter.theme,
                    status: chapter.status,
                    description: chapter.description,
                    coverPath: chapter.coverPath,
                    coverUrl: chapter.coverUrl,
                    lastChapter: chapter.lastChapter,
                    chapterUrl: chapter.chapterUrl,
                    mangaUrl: chapter.mangaUrl,
                    site: chapter.site,
                }));

                mangas.value = mangaList.filter((manga) => manga !== null) as Manga[];
                loading.value = false;
            } catch (error) {
                console.error("❌ Erreur lors de la récupération des mangas :", error);
                loading.value = false;
            }
        };

        onMounted(fetchMangas);

        return { mangas, loading };
    },
});
