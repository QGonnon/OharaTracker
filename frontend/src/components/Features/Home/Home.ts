import { defineComponent, ref, onMounted } from "vue";
import Menu from "../../Common/Menu/Menu.vue";
import MangaCard from "../../Shared/MangaCard/MangaCard.vue";

export default defineComponent({
  name: "Home",
  components: {
    Menu,
    MangaCard,
  },
  setup() {
    const featuredMangas = ref<any[]>([]);
    const latestChapters = ref<any[]>([]);
    const loading = ref(true);

    const fetchMangas = async () => {
      const chapterUrl = `${import.meta.env.VITE_API_URL}/chapters`;
      try {
        const res = await fetch(chapterUrl);
        const chapters = (await res.json()) || [];

        // Conserver derniers chapitres
        latestChapters.value = chapters.slice(0, 10);

        // Construire liste de mangas dédupliquée
        const map = new Map();
        const mangas = chapters.map((ch: any) => ({
          id: ch.chapterId,
          title: ch.title,
          author: ch.author,
          theme: ch.theme,
          status: ch.status,
          description: ch.description,
          coverPath: ch.coverPath,
          coverUrl: ch.coverUrl,
          lastChapter: ch.lastChapter,
          chapterUrl: ch.chapterUrl,
          mangaUrl: ch.mangaUrl,
          site: ch.site,
        }));

        for (const m of mangas) {
          const key = (m.title || "").toLowerCase().trim();
          if (!map.has(key)) map.set(key, m);
        }

        featuredMangas.value = Array.from(map.values()).slice(0, 6);
      } catch (err) {
        console.error("Erreur fetching mangas:", err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchMangas);

    return { featuredMangas, latestChapters, loading };
  },
});
