import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'Status',
  components: { Menu },
  setup() {
    usePageSeo('status');
    const services = [
      { key: 'static.status.service_api' },
      { key: 'static.status.service_web' },
      { key: 'static.status.service_notifications' },
      { key: 'static.status.service_sources' },
    ];

    return { services };
  },
});
