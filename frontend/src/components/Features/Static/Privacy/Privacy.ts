import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';

export default defineComponent({
  name: 'Privacy',
  components: { Menu },
  setup() {
    const sections = [
      { title: 'legal.privacy.s1_title', text: 'legal.privacy.s1_text' },
      { title: 'legal.privacy.s2_title', text: 'legal.privacy.s2_text' },
      { title: 'legal.privacy.s3_title', text: 'legal.privacy.s3_text' },
    ];

    return { sections };
  },
});
