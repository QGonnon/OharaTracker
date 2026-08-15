import { defineComponent } from 'vue'
import EditProgressDialog from '../EditProgressDialog/EditProgressDialog.vue'

// Enveloppe fine autour du composant abstrait EditProgressDialog, configurée pour le manga.
// Conserve l'API publique historique (prop `manga`) pour ne pas impacter les appelants.
export default defineComponent({
  name: 'EditLibraryDialog',
  components: { EditProgressDialog },
  props: {
    visible: { type: Boolean, required: true },
    manga: { type: Object as () => any, required: false }
  },
  emits: ['update:visible', 'updated', 'deleted']
})
