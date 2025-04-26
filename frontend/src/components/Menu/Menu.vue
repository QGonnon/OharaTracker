<template>
  <header :class="['menu-header', { 'menu--shrink': isShrunk }]">
    <nav class="menu-nav">
      <h1 class="menu-title">OharaTracker</h1>
      <ul class="menu-links">
        <li class="menu-item" @mouseenter="toggleDropdown('scans')" @mouseleave="toggleDropdown(null)">
          <router-link to="/scans" class="menu-link">Scans</router-link>
          <ul v-if="activeDropdown === 'scans'" class="dropdown">
            <li><router-link to="/scans/new" class="dropdown-item">Dernières sorties</router-link></li>
            <li><router-link to="/scans/library" class="dropdown-item">Bibliothèque complète</router-link></li>
          </ul>
        </li>
        <li class="menu-item" @mouseenter="toggleDropdown('mangas')" @mouseleave="toggleDropdown(null)">
          <router-link to="/mangas" class="menu-link">Mangas</router-link>
          <ul v-if="activeDropdown === 'mangas'" class="dropdown">
            <li><router-link to="/mangas/new" class="dropdown-item">Dernières sorties</router-link></li>
            <li><router-link to="/mangas/library" class="dropdown-item">Bibliothèque complète</router-link></li>
          </ul>
        </li>
        <li class="menu-item" @mouseenter="toggleDropdown('animes')" @mouseleave="toggleDropdown(null)">
          <router-link to="/animes" class="menu-link">Animes</router-link>
          <ul v-if="activeDropdown === 'animes'" class="dropdown">
            <li><router-link to="/animes/new" class="dropdown-item">Dernières sorties</router-link></li>
            <li><router-link to="/animes/library" class="dropdown-item">Bibliothèque complète</router-link></li>
          </ul>
        </li>
        <li><router-link to="/suivis" class="menu-link">Mes suivis</router-link></li>
      </ul>
    </nav>
  </header>
</template>

<script lang="ts" src="./Menu.ts"></script>

<style scoped src="./Menu.css"></style>
  
  <!-- suite à réaliser : j'aimerais avoir un menu déroulant dans mes suivis avec scans mangas animés dedans pour que l'utilisateur puisse accéder soit à tous ses suivis en cliquant sur mes suivis soit au type de média qu'il souhaite en particulier en passant sa souris sur mes suivis et en cliquant sur un de ses types qu'il désire. -->