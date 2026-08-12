import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { Button } from 'primevue';

// Image fournie par l'utilisateur : à placer dans frontend/src/assets/images/ohara_logo_Discord.webp
const discordQr = new URL('../../../../assets/images/ohara_logo_Discord.webp', import.meta.url).href;
const DISCORD_URL = 'https://discord.gg/DfsFuSdDp';

export default defineComponent({
  name: 'Contact',
  components: { Menu, Button },
  setup() {
    return { discordQr, DISCORD_URL };
  },
});
