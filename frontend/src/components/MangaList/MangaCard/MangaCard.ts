import { defineComponent } from "vue";

interface Manga {
    id: string;
    title: string;
    lastChapter: string;
    chapterUrl: string;
    mangaUrl: string;
}

export default defineComponent({
    props: {
        manga: {
            type: Object as () => Manga,
            required: true,
        },
    },
    setup(props) {
        return { manga: props.manga };
    },
});