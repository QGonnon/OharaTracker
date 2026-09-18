import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'OfficialPartners',
  components: { Menu },
  setup() {
    usePageSeo('officialPartners');
  },
});
