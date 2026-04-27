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
      { value: "12 400+", label: "Mangas disponibles" },
      { value: "3 200+", label: "Animes référencés" },
      { value: "48 000+", label: "Utilisateurs actifs" },
      { value: "980K+", label: "Chapitres suivis" },
    ];

    const features = [
      {
        icon: "🔍",
        title: "Recherche avancée",
        desc: "Trouvez n'importe quel manga en quelques secondes grâce à notre moteur de recherche intelligent.",
      },
      {
        icon: "📌",
        title: "Suivi personnalisé",
        desc: "Gardez une trace de vos lectures avec des listes personnalisables, notes et statuts.",
      },
      {
        icon: "🔔",
        title: "Notifications",
        desc: "Soyez alerté dès qu'un nouveau chapitre est disponible pour vos séries favorites.",
      },
      {
        icon: "🌐",
        title: "Multi-sources",
        desc: "Agrégez le contenu de plusieurs plateformes dans une interface unifiée.",
      },
      {
        icon: "📊",
        title: "Statistiques",
        desc: "Visualisez vos habitudes de lecture avec des graphiques et rapports détaillés.",
      },
      {
        icon: "🤝",
        title: "Communauté",
        desc: "Échangez avec d'autres passionnés, partagez vos avis et découvrez de nouvelles séries.",
      },
    ];

    const steps = [
      {
        title: "Créez votre compte",
        text: "Inscrivez-vous gratuitement en quelques secondes. Aucune carte de crédit requise.",
      },
      /* {
        title: "Importez vos listes",
        text: "Importez vos listes depuis MangaDex, AniList ou d'autres plateformes supportées.",
      }, */
      {
        title: "Suivez vos lectures",
        text: "Ajoutez vos mangas favoris, marquez les chapitres lus et restez informé des nouvelles sorties.",
      },
      {
        title: "Explorez et découvrez",
        text: "Parcourez notre catalogue et obtenez des recommandations personnalisées.",
      },
    ];

    return { mockItems, stats, features, steps };
  },
});
