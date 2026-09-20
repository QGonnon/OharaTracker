import { defineComponent, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Menu from '../../../Shared/Menu/Menu.vue';
import PartnerService, { type Partner } from '../../../../services/partner.service';
import { usePageSeo } from '../../../../seo/usePageSeo';

export default defineComponent({
  name: 'SupportedSites',
  components: { Menu },
  setup() {
    usePageSeo('supportedSites');
    const { locale } = useI18n();
    const sites = ref<Partner[]>([]);

    onMounted(async () => {
      try {
        sites.value = await PartnerService.list({ kind: 'platform', locale: locale.value });
      } catch {
        sites.value = [];
      }
    });

    return { sites };
  },
});
