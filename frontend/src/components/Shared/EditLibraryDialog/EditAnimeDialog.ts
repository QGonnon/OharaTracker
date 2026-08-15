import { defineComponent } from 'vue'
import EditProgressDialog from './EditProgressDialog.vue'

// Enveloppe fine autour du composant abstrait EditProgressDialog, configurée pour l'anime.
// Conserve l'API publique historique (prop `anime`) pour ne pas impacter les appelants.
export default defineComponent({
  name: 'EditAnimeDialog',
  components: { EditProgressDialog },
  props: {
    visible: { type: Boolean, required: true },
    anime: { type: Object as () => any, required: false }
  },
  emits: ['update:visible', 'updated', 'deleted']
})
