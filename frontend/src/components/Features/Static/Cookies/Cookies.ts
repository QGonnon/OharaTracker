import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'Cookies',
  components: { Menu },
  setup() {
    usePageSeo('cookies');
    const sections = [
      { title: 'legal.cookies.s1_title', text: 'legal.cookies.s1_text' },
      { title: 'legal.cookies.s2_title', text: 'legal.cookies.s2_text' },
    ];

    return { sections };
  },
});
