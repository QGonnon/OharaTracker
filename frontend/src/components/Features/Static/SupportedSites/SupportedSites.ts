import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';

export default defineComponent({
  name: 'SupportedSites',
  components: { Menu },
  setup() {
    const sites = ['MangaDex', 'AniList', 'Asura Scans'];

    return { sites };
  },
});
