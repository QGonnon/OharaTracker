import { defineComponent, ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Menu from '../../../Shared/Menu/Menu.vue';
import PartnerService, { type Partner } from '../../../../services/partner.service';
import { usePageSeo } from '../../../../seo/usePageSeo';
import { localePath } from '../../../../seo/localePath';

export default defineComponent({
  name: 'OfficialPartners',
  components: { Menu },
  setup() {
    usePageSeo('officialPartners');
    const { locale } = useI18n();
    const partners = ref<Partner[]>([]);
    const loading = ref(true);

    onMounted(async () => {
      try {
        partners.value = await PartnerService.list({ locale: locale.value });
      } catch {
        partners.value = [];
      } finally {
        loading.value = false;
      }
    });

    return {
      partners,
      loading,
      highlighted: computed(() => partners.value.filter(partner => partner.isHighlighted)),
      others: computed(() => partners.value.filter(partner => !partner.isHighlighted)),
      contactLink: computed(() => localePath('contact')),
    };
  },
});
