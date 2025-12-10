import { ref } from 'vue'
import { slugify } from '../../../utils.js'
import { defineComponent } from "vue";
import Card from 'primevue/card';
import { Button } from 'primevue';

interface Manga {
    id: string;
    title: string;
    lastChapter: string;
    chapterUrl: string;
    mangaUrl: string;
    site: string;
}

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
        const randomImage = ref(`https://picsum.photos/seed/${manga.id}/400/200`)
        return { manga, randomImage, cleanTitle };
    },
});
