import { defineComponent, computed, ref, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import Menu from "../../Shared/Menu/Menu.vue";
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useAuthStore } from "../../../store/auth.module";
import { useSeo } from "../../../seo/useSeo";
import { organizationJsonLd, webApplicationJsonLd, websiteJsonLd } from "../../../seo/jsonld";
import { DEFAULT_LOCALE, isLocale, pagePath, type Locale } from "../../../seo/config";
import { localeHome, localePath } from "../../../seo/localePath";

// Versions réduites générées par `npm run optimize:screenshots` (sources conservées à côté).
const libraryImg   = new URL('../../../assets/screenshots/library-preview.webp',   import.meta.url).href
const discoveryImg = new URL('../../../assets/screenshots/discovery-preview.webp',  import.meta.url).href
const trackingImg  = new URL('../../../assets/screenshots/tracking-preview.webp',   import.meta.url).href
const profileImg   = new URL('../../../assets/screenshots/profile-preview.webp',    import.meta.url).href

export default defineComponent({
  name: "Home",
  components: { Menu, Button, Tag },
  setup() {
    const authStore  = useAuthStore();
    const isLoggedIn = computed(() => authStore.isLoggedIn);
    const { t, locale } = useI18n();

    const currentLocale = computed<Locale>(() =>
      isLocale(locale.value) ? locale.value : DEFAULT_LOCALE
    );

    // Les autres pages référencent ces entités par @id plutôt que de les redupliquer.
    useSeo({
      target: { type: 'home' },
      title: computed(() => t('seo.home.title')),
      description: computed(() => t('seo.home.description')),
      jsonLd: computed(() => [
        organizationJsonLd(currentLocale.value, t('seo.home.description')),
        websiteJsonLd(currentLocale.value, pagePath('search', currentLocale.value)),
        webApplicationJsonLd(currentLocale.value, t('seo.home.description')),
      ]),
    });

    const registerPath = computed(() => localePath('register'));
    const pricingPath = computed(() => localePath('pricing'));
    const discoveryPath = computed(() => localePath('discovery'));
    const homeLink = computed(() => localeHome());

    const lightboxSrc = ref<string | null>(null)
    const lightboxAlt = ref('')
    const lightboxCloseRef = ref<HTMLElement | null>(null)
    let lastFocused: HTMLElement | null = null // pour rendre le focus à la fermeture

    const openLightbox = async (src: string, alt = '') => {
      lastFocused = document.activeElement as HTMLElement | null
      lightboxSrc.value = src
      lightboxAlt.value = alt
      document.body.style.overflow = 'hidden'
      await nextTick()
      lightboxCloseRef.value?.focus()
    }

    const closeLightbox = () => {
      lightboxSrc.value = null
      lightboxAlt.value = ''
      document.body.style.overflow = ''
      lastFocused?.focus()
    }

    const trapFocus = () => lightboxCloseRef.value?.focus()

    const scrollToScreenshots = () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById("screenshots")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    };

    const mockItems = [
      { title: "One Piece",      chapter: "1110", statusKey: "home.mock_status_ongoing",  severity: "info"      as const, color: "bg-gradient-to-br from-orange-300 to-orange-500" },
      { title: "Jujutsu Kaisen", chapter: "265",  statusKey: "home.mock_status_finished", severity: "success"   as const, color: "bg-gradient-to-br from-purple-400 to-indigo-600" },
      { title: "Chainsaw Man",   chapter: "172",  statusKey: "home.mock_status_ongoing",  severity: "info"      as const, color: "bg-gradient-to-br from-red-400 to-orange-500" },
      { title: "Berserk",        chapter: "374",  statusKey: "home.mock_status_planned",  severity: "secondary" as const, color: "bg-gradient-to-br from-zinc-500 to-zinc-700" },
      { title: "Vinland Saga",   chapter: "212",  statusKey: "home.mock_status_paused",   severity: "warn"      as const, color: "bg-gradient-to-br from-amber-300 to-amber-500" },
    ];

    const stats = [
      { value: "12 400+", label: "home.number_manga"   },
      { value: "3 200+",  label: "home.number_anime"   },
      { value: "48 000+", label: "home.number_users"   },
      { value: "980K+",   label: "home.number_chapter" },
    ];

    const features = [
      { icon: "🔍", title: "home.advanced_search",      desc: "home.advanced_search_text"      },
      { icon: "📌", title: "home.personalized_tracking", desc: "home.personalized_tracking_text" },
      { icon: "🔔", title: "home.notification",          desc: "home.notification_text"          },
      { icon: "🌐", title: "home.multi_source",           desc: "home.multi_source_text"          },
      { icon: "📊", title: "home.statistics",             desc: "home.statistics_text"            },
      { icon: "🤝", title: "home.community",              desc: "home.community_text"             },
    ];

    const steps = [
      { title: "home.steps1_title", text: "home.steps1_desc" },
      { title: "home.steps2_title", text: "home.steps2_desc" },
      { title: "home.steps3_title", text: "home.steps3_desc" },
    ];

    return {
      isLoggedIn,
      mockItems, stats, features, steps,
      scrollToScreenshots,
      libraryImg, discoveryImg, trackingImg, profileImg,
      lightboxSrc, lightboxAlt, lightboxCloseRef, openLightbox, closeLightbox, trapFocus,
      registerPath, pricingPath, discoveryPath, homeLink,
    };
  },
});
