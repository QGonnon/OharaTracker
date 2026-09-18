import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'SupportedSites',
  components: { Menu },
  setup() {
    usePageSeo('supportedSites');
    const sites = ['MangaDex', 'AniList', 'Asura Scans'];

    return { sites };
  },
});
