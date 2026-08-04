import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { Button } from 'primevue';

const DISCORD_URL = 'https://discord.gg/DfsFuSdDp';

export default defineComponent({
  name: 'Suggestions',
  components: { Menu, Button },
  setup() {
    return { DISCORD_URL };
  },
});
