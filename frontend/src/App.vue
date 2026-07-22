<script setup lang="ts">
import Footer from './components/Shared/Footer/Footer.vue'
</script>

<template>
  <div class="layout-main-container">
    <div class="layout-main">
      <router-view />
    </div>
    <Footer />
  </div>
</template>
