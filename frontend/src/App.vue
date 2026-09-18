<template>
  <div>
    <!-- Lien d'évitement : évite de retraverser tout l'en-tête au clavier à chaque page. -->
    <a href="#main-content" class="skip-link">{{ $t('a11y.skip_to_content') }}</a>

    <main id="main-content" tabindex="-1">
      <router-view />
    </main>

    <Footer />
  </div>
</template>

<style src="./App.css"></style>

<script src="./App.ts"></script>
