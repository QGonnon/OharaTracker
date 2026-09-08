import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'Terms',
  components: { Menu },
  setup() {
    usePageSeo('terms');
    const sections = [
      { title: 'legal.terms.s1_title', text: 'legal.terms.s1_text' },
      { title: 'legal.terms.s2_title', text: 'legal.terms.s2_text' },
      { title: 'legal.terms.s3_title', text: 'legal.terms.s3_text' },
      { title: 'legal.terms.s4_title', text: 'legal.terms.s4_text' },
    ];

    return { sections };
  },
});
