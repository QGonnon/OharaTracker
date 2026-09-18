import { ref, computed } from 'vue'
import { slugify } from '../../../utils.js'
import { localeMedia } from '../../../seo/localePath'
import { defineComponent } from "vue";
import Card from 'primevue/card';
import Button from 'primevue/button'
import type { Manga } from '../../../types/index'
import { CDN_BASE } from '../../../services/api'

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
        const workPath = computed(() => localeMedia('lecture', cleanTitle))
        // Placeholder servi depuis notre domaine : une image externe aléatoire
        // (picsum) ralentissait le rendu et changeait à chaque chargement.
        const fallbackImage = ref('/cover-placeholder.svg')

        const coverSrc = computed(() => {
            if (manga.coverPath) {
                return `${CDN_BASE}/${manga.coverPath}`;
            }
            if (manga.coverUrl) return manga.coverUrl;
            return fallbackImage.value;
        })

        return { manga, coverSrc, cleanTitle, workPath };
    },
});
