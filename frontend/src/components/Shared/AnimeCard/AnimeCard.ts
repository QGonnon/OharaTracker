import { ref, computed } from 'vue'
import { slugify } from '../../../utils.js'
import { defineComponent } from "vue";
import Card from 'primevue/card';
import { Button } from 'primevue';
import type { Manga } from '../../../types/index'

export default defineComponent({
    props: {
        manga: {
            type: Object as () => Manga,
            required: true,
        },
    },
    components: {
        Card,
        Button,
    },
    setup(props) {
        const manga = props.manga
        const cleanTitle = slugify(manga.title)
        const fallbackImage = ref(`https://picsum.photos/seed/${manga.id}/400/200`)

        const coverSrc = computed(() => {
            const apiBase = import.meta.env.VITE_API_URL;
            if ((manga as any).coverPath) {
                return `${apiBase}/cdn/${(manga as any).coverPath}`;
            }
            if ((manga as any).coverUrl) return (manga as any).coverUrl;
            return fallbackImage.value;
        })

        return { manga, coverSrc, cleanTitle };
    },
});
