import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';

export default defineComponent({
  name: 'Cookies',
  components: { Menu },
  setup() {
    const sections = [
      { title: 'legal.cookies.s1_title', text: 'legal.cookies.s1_text' },
      { title: 'legal.cookies.s2_title', text: 'legal.cookies.s2_text' },
    ];

    return { sections };
  },
});
