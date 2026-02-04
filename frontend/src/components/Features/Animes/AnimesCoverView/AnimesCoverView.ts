import { defineComponent, onMounted, ref } from "vue";
import Menu from "../../../Common/Menu/Menu.vue";
import AnimeCard from "../../../Shared/AnimeCard/AnimeCard.vue";
import type { Manga } from "../../../../types/index";

export default defineComponent({
    components: {
        Menu,
        AnimeCard,
    },
    setup() {
        const mangas = ref<Manga[]>([]);
        const loading = ref<boolean>(true);

        const fetchAnimes = async () => {
            const chapterUrl = `${import.meta.env.VITE_API_URL}/chapters`;

            try {
                const response = await fetch(chapterUrl);
                const chapters = await response.json() || [];

                // Garder uniquement les entrées provenant d'AniList (anime)
                const animeChapters = (chapters || []).filter((c: any) => {
                    const site = (c.site || '').toString().toLowerCase();
                    return site === 'moviedb' || site === 'anime' || site === 'animes';
                });

                const mangaList: Manga[] = animeChapters.map((chapter: any) => ({
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

                // Dédupliquer par titre normalisé - garder l'entrée avec le chapitre le plus récent
                const uniqueMangaMap = new Map<string, Manga>();
                for (const manga of mangaList) {
                    const normalizedKey = (manga.title || '')
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s]/g, '')
                        .replace(/\s+/g, ' ');
                    if (!normalizedKey) continue;
                    const existing = uniqueMangaMap.get(normalizedKey);
                    if (!existing) {
                        uniqueMangaMap.set(normalizedKey, manga);
                    } else {
                        const currentChapter = Number(manga.lastChapter) || 0;
                        const existingChapter = Number(existing.lastChapter) || 0;
                        if (currentChapter > existingChapter) {
                            uniqueMangaMap.set(normalizedKey, manga);
                        }
                    }
                }

                const uniqueMangaList = Array.from(uniqueMangaMap.values());
                uniqueMangaList.sort((a, b) => {
                    const aChapter = Number(a.lastChapter) || 0;
                    const bChapter = Number(b.lastChapter) || 0;
                    return bChapter - aChapter;
                });

                mangas.value = uniqueMangaList as Manga[];
                loading.value = false;
            } catch (error) {
                console.error("❌ Erreur lors de la récupération des animes :", error);
                loading.value = false;
            }
        };

        onMounted(fetchAnimes);

        return { mangas, loading };
    },
});