import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'Blog',
  components: { Menu },
  setup() {
    usePageSeo('blog');
  },
});
