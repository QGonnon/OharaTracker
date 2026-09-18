import { defineComponent } from 'vue';
import Menu from '../../../Shared/Menu/Menu.vue';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'Changelog',
  components: { Menu },
  setup() {
    usePageSeo('changelog');
    const entries = [
      { version: 'v1.2.0', date: '2026-06', key: 'static.changelog.v3' },
      { version: 'v1.1.0', date: '2026-03', key: 'static.changelog.v2' },
      { version: 'v1.0.0', date: '2026-01', key: 'static.changelog.v1' },
    ];

    return { entries };
  },
});
