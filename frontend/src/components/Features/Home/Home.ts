import { defineComponent } from "vue";
import Menu from "../../Shared/Menu/Menu.vue";
import { Button, Tag } from "primevue";

export default defineComponent({
  name: "Home",
  components: { Menu, Button, Tag },
  setup() {
    const mockItems = [
      {
        title: "One Piece",
        chapter: "1110",
        status: "En cours",
        severity: "info" as const,
        color: "bg-gradient-to-br from-orange-300 to-orange-500",
      },
      {
        title: "Jujutsu Kaisen",
        chapter: "265",
        status: "Terminé",
        severity: "success" as const,
        color: "bg-gradient-to-br from-purple-400 to-indigo-600",
      },
      {
        title: "Chainsaw Man",
        chapter: "172",
        status: "En cours",
        severity: "info" as const,
        color: "bg-gradient-to-br from-red-400 to-orange-500",
      },
      {
        title: "Berserk",
        chapter: "374",
        status: "Planifié",
        severity: "secondary" as const,
        color: "bg-gradient-to-br from-zinc-500 to-zinc-700",
      },
      {
        title: "Vinland Saga",
        chapter: "212",
        status: "En pause",
        severity: "warn" as const,
        color: "bg-gradient-to-br from-amber-300 to-amber-500",
      },
    ];

    const stats = [
      { value: "12 400+", label: "home.number_manga" },
      { value: "3 200+", label: "home.number_anime" },
      { value: "48 000+", label: "home.number_users" },
      { value: "980K+", label: "home.number_chapter" },
    ];

    const features = [
      {
        icon: "🔍",
        title: 'home.advanced_reaserch',
        desc: 'home.advanced_reaserch_text',
      },
      {
        icon: "📌",
        title: 'home.personalized_tracking',
        desc: 'home.personalized_tracking_text',
      },
      {
        icon: "🔔",
        title: 'home.notification',
        desc: 'home.notification_text',
      },
      {
        icon: "🌐",
        title: 'home.multi_source',
        desc: 'home.multi_source_text',
      },
      {
        icon: "📊",
        title: 'home.statistics',
        desc: 'home.statistics_text',
      },
      {
        icon: "🤝",
        title: 'home.community',
        desc: 'home.community_text',
      },
    ];

    const steps = [
      {
        title: 'home.steps1_title',
        text: 'home.steps1_desc',
      },
      /* {
        title: "Importez vos listes",
        text: "Importez vos listes depuis MangaDex, AniList ou d'autres plateformes supportées.",
      }, */
      {
        title: 'home.steps2_title',
        text: 'home.steps2_desc',
      },
      {
        title: 'home.steps3_title',
        text: 'home.steps3_desc',
      },
    ];

    return { mockItems, stats, features, steps };
  },
});
