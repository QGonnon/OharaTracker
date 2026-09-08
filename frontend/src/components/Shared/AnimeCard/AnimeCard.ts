import { ref, computed } from 'vue'
import { slugify } from '../../../utils.js'
import { localeMedia } from '../../../seo/localePath'
import { defineComponent } from "vue";
import Card from 'primevue/card';
import Button from 'primevue/button'
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
        // Lien canonique localisé plutôt qu'un chemin en dur : évite une redirection
        const workPath = computed(() => localeMedia('serie', cleanTitle))
        // Placeholder servi depuis notre domaine : une image externe aléatoire
        // (picsum) ralentissait le rendu et changeait à chaque chargement.
        const fallbackImage = ref('/cover-placeholder.svg')

        const coverSrc = computed(() => {
            const apiBase = import.meta.env.VITE_API_URL;
            if ((manga as any).coverPath) {
                return `${apiBase}/cdn/${(manga as any).coverPath}`;
            }
            if ((manga as any).coverUrl) return (manga as any).coverUrl;
            return fallbackImage.value;
        })

        return { manga, coverSrc, cleanTitle, workPath };
    },
});
