import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import Button from 'primevue/button'
import { usePageSeo } from '../../../../seo/usePageSeo';

const DISCORD_URL = 'https://discord.gg/DfsFuSdDp';

export default defineComponent({
  name: 'Suggestions',
  components: { Menu, Button },
  setup() {
    usePageSeo('suggestions');
    return { DISCORD_URL };
  },
});
