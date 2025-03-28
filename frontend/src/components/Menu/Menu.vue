<template>
    <header :class="['menu-header', { 'menu--shrink': isShrunk }]">
      <nav class="menu-nav">
        <h1 class="menu-title">OharaTracker</h1>
        <ul class="menu-links">
          <li><router-link to="/" class="menu-link">Accueil</router-link></li>
          <li><router-link to="/scans" class="menu-link">Scans</router-link></li>
          <li><router-link to="/mangas" class="menu-link">Mangas</router-link></li>
          <li><router-link to="/animes" class="menu-link">Animes</router-link></li>
          <li><router-link to="/suivis" class="menu-link">Mes suivis</router-link></li>
        </ul>
      </nav>
    </header>
  </template>
  
  <script lang="ts" src="./Menu.ts"></script>
  <style scoped src="./Menu.css"></style>
  
  <!-- suite à réaliser :quand on clique sur scans mangas ou animes ca nou laisse le choix entre nouvelles sorties ou bibliothèque (dropdown) + j'aimerais avoir un menu déroulant dans mes suivis avec scans mangas animés dedans pour que l'utilisateur puisse accéder soit à tous ses suivis en cliquant dessus mes suivis soit au type de média qu'il souhaite en particulier en passant sa souris sur mes suivis et en cliquant sur un de ses types qu'il désire. -->