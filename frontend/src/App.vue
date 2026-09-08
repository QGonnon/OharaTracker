<script setup lang="ts">
import Footer from './components/Shared/Footer/Footer.vue'
</script>

<template>
  <div>
    <!--
      Lien d'évitement : premier élément focusable de la page, visible uniquement
      au focus clavier. Sans lui, un utilisateur au clavier doit retraverser
      l'intégralité de l'en-tête (navigation, langue, thème, notifications,
      compte) à chaque changement de page pour atteindre le contenu.
    -->
    <a href="#main-content" class="skip-link">{{ $t('a11y.skip_to_content') }}</a>

    <!-- Landmark principal : permet la navigation directe au contenu avec un lecteur d'écran. -->
    <main id="main-content" tabindex="-1">
      <router-view />
    </main>

    <Footer />
  </div>
</template>

<style>
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: 0.75rem 1.25rem;
  background: #4338ca;
  color: #fff;
  font-weight: 600;
  border-radius: 0 0 8px 0;
  text-decoration: none;
}

.skip-link:focus {
  left: 0;
  top: 0;
  outline: 3px solid #fff;
  outline-offset: -3px;
}

/* La cible du lien d'évitement reçoit le focus par programme : le contour
   n'apporterait rien ici, le déplacement du focus est déjà l'information. */
#main-content:focus {
  outline: none;
}

/*
  Réserve la hauteur du contenu avant l'arrivée du code de la page.

  Les routes sont chargées à la demande : tant que leur chunk n'est pas exécuté,
  `<router-view>` est vide et le pied de page remonte en haut de l'écran, puis
  redescend d'un coup. Lighthouse mesurait un décalage cumulé (CLS) de 0,678 sur
  les pages concernées — c'est aussi désagréable à l'usage qu'à la mesure.
  Une hauteur minimale d'un écran garantit que le pied de page reste sous la
  ligne de flottaison, donc qu'aucun décalage n'est visible.
*/
#main-content {
  min-height: 100vh;
}
</style>
