import { defineComponent, onMounted, ref } from "vue";
import MangaCard from "./MangaCard/MangaCard.vue";

interface Manga {
    id: string;
    title: string;
    lastChapter: string;
    chapterUrl: string;
    mangaUrl: string;
    site: string;
}

export default defineComponent({
    components: {
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
                
                const mangaList: Manga[] = chapters.map((chapter: any) => {
                    const chapterId = chapter.id;
                    const title = chapter.name;
                    const lastChapter = chapter.lastChapter;
                    const chapterUrl = chapter.chapterUrl;
                    const mangaUrl = chapter.mangaUrl;
                    const site = chapter.site;

                    return { id: chapterId, title, lastChapter, chapterUrl, mangaUrl, site };
                });

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