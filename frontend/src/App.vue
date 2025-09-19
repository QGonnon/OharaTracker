<template>
  <div id="app">
    <div class="view-switcher">
      <button :class="{ active: currentView === 'list' }" @click="currentView = 'list'" title="Vue liste">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="2" rx="1" fill="#3b82f6"/><rect x="4" y="11" width="16" height="2" rx="1" fill="#3b82f6"/><rect x="4" y="16" width="16" height="2" rx="1" fill="#3b82f6"/></svg>
      </button>
      <button :class="{ active: currentView === 'cover' }" @click="currentView = 'cover'" title="Vue cover">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2" fill="#3b82f6"/><rect x="13" y="4" width="7" height="7" rx="2" fill="#3b82f6"/><rect x="4" y="13" width="7" height="7" rx="2" fill="#3b82f6"/><rect x="13" y="13" width="7" height="7" rx="2" fill="#3b82f6"/></svg>
      </button>
    </div>
    <component :is="currentView === 'list' ? 'MangasListView' : 'MangasCoverView'" />
    <!-- <Login /> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import MangasCoverView from "./components/MangasCoverView/MangasCoverView.vue";
import Login from "./components/Login/Login.vue";
import MangasListView from "./components/MangasListView/MangasListView.vue";

export default defineComponent({
  components: {
    MangasCoverView,
    Login,
    MangasListView,
  },
  setup() {
    const currentView = ref<'list' | 'cover'>('list');
    return { currentView };
  }
});
</script>

<style>
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 0;
}

.view-switcher {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-bottom: 24px;
}
.view-switcher button {
  background: none;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  outline: none;
}
.view-switcher button.active {
  background: #e0e7ff;
}
.view-switcher svg {
  vertical-align: middle;
}
</style>
