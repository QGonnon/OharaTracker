<template>
  <Menu />

  <!-- ── SPOTLIGHT ─────────────────────────────── -->
  <section class="disc-spotlight" v-if="spotlightItem && !loading">
    <div
      class="spotlight-backdrop"
      :style="{ backgroundImage: `url(${spotlightItem.coverUrl})` }"
    ></div>
    <div class="spotlight-fog"></div>

    <div class="spotlight-inner">
      <div class="spotlight-cover-wrap">
        <img
          :src="spotlightItem.coverUrl"
          :alt="spotlightItem.title"
          class="spotlight-cover"
        />
        <div class="spotlight-cover-glow"></div>
      </div>

      <div class="spotlight-details">
        <div class="spotlight-tags">
          <span
            class="stag-type"
            :class="isAnime(spotlightItem) ? 'stag-anime' : 'stag-manga'"
          >
            {{ isAnime(spotlightItem) ? 'Anime' : 'Manga' }}
          </span>
          <span
            v-for="tag in getThemeTags(spotlightItem)"
            :key="tag"
            class="stag-genre"
          >{{ tag }}</span>
        </div>

        <h1 class="spotlight-title">{{ spotlightItem.title }}</h1>

        <p v-if="spotlightItem.description" class="spotlight-desc">
          {{ truncate(spotlightItem.description, 180) }}
        </p>

        <div class="spotlight-meta" v-if="spotlightItem.lastChapter || spotlightItem.lastEpisode">
          <span class="meta-pill">
            {{ isAnime(spotlightItem) ? 'Ép. ' + spotlightItem.lastEpisode : 'Ch. ' + spotlightItem.lastChapter }}
          </span>
          <span class="meta-pill meta-status" v-if="spotlightItem.status">
            {{ spotlightItem.status }}
          </span>
        </div>

        <div class="spotlight-actions">
          <a
            :href="spotlightItem.chapterUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="spt-btn spt-btn-read"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {{ isAnime(spotlightItem) ? 'Regarder' : 'Lire maintenant' }}
          </a>
          <RouterLink
            :to="isAnime(spotlightItem) ? `/anime/${slugify(spotlightItem.title)}` : `/manga/${slugify(spotlightItem.title)}`"
            class="spt-btn spt-btn-info"
          >
            Détails
          </RouterLink>
        </div>
      </div>
    </div>
  </section>

  <!-- Spotlight skeleton -->
  <div v-if="loading" class="spotlight-skel"></div>

  <!-- ── BODY ───────────────────────────────────── -->
  <div class="disc-body">

    <!-- FILTER BAR -->
    <div class="disc-filters">
      <div class="filter-types">
        <button
          v-for="t in types"
          :key="t.value"
          :class="['ftype-btn', { active: activeType === t.value }]"
          @click="setType(t.value)"
        >
          {{ t.label }}
        </button>
      </div>

      <div class="filter-genres" v-if="availableGenres.length">
        <button
          :class="['genre-chip', { active: activeGenre === '' }]"
          @click="activeGenre = ''"
        >Tous</button>
        <button
          v-for="genre in availableGenres"
          :key="genre"
          :class="['genre-chip', { active: activeGenre === genre }]"
          @click="toggleGenre(genre)"
        >{{ genre }}</button>
      </div>
    </div>

    <!-- TRENDING STRIP -->
    <section class="disc-section" v-if="trending.length && activeGenre === '' && activeType === 'all'">
      <div class="disc-section-head">
        <div class="section-title-row">
          <span class="section-bar"></span>
          <h2 class="disc-section-title">Tendances</h2>
        </div>
      </div>

      <div class="trending-strip">
        <RouterLink
          v-for="(item, i) in trending"
          :key="item.title"
          :to="isAnime(item) ? `/anime/${slugify(item.title)}` : `/manga/${slugify(item.title)}`"
          class="trend-card"
        >
          <span class="trend-rank" :class="{ 'top3': i < 3 }">
            {{ String(i + 1).padStart(2, '0') }}
          </span>
          <div class="trend-cover-wrap">
            <img :src="item.coverUrl" :alt="item.title" class="trend-cover" loading="lazy" />
          </div>
          <div class="trend-info">
            <p class="trend-title">{{ item.title }}</p>
            <p class="trend-sub">
              {{ isAnime(item) ? 'Ép. ' + (item.lastEpisode || '—') : 'Ch. ' + (item.lastChapter || '—') }}
            </p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- MAIN GRID -->
    <section class="disc-section">
      <div class="disc-section-head">
        <div class="section-title-row">
          <span class="section-bar"></span>
          <h2 class="disc-section-title">{{ sectionTitle }}</h2>
          <span class="item-count" v-if="!loading">{{ filteredItems.length }}</span>
        </div>
        <div class="sort-controls">
          <button
            :class="['sort-btn', { active: sortBy === 'latest' }]"
            @click="sortBy = 'latest'"
          >Récent</button>
          <button
            :class="['sort-btn', { active: sortBy === 'alpha' }]"
            @click="sortBy = 'alpha'"
          >A → Z</button>
        </div>
      </div>

      <!-- Skeleton loader -->
      <div v-if="loading" class="disc-grid">
        <div v-for="n in 15" :key="n" class="disc-card-skel">
          <div class="skel-img"></div>
          <div class="skel-line"></div>
          <div class="skel-line skel-short"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <span class="empty-icon">🔍</span>
        <p class="empty-text">Aucun résultat pour ces filtres</p>
        <button class="reset-btn" @click="resetFilters">Réinitialiser les filtres</button>
      </div>

      <!-- Grid -->
      <div v-else class="disc-grid">
        <div
          v-for="item in filteredItems"
          :key="item.title"
          class="disc-card"
        >
          <div class="disc-img-wrap">
            <RouterLink
              :to="isAnime(item) ? `/anime/${slugify(item.title)}` : `/manga/${slugify(item.title)}`"
            >
              <img
                :src="item.coverUrl"
                :alt="item.title"
                class="disc-img"
                loading="lazy"
              />
            </RouterLink>

            <div class="disc-overlay">
              <p class="disc-overlay-title">{{ item.title }}</p>
              <a
                :href="item.chapterUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="disc-read-btn"
              >
                {{ isAnime(item) ? 'Regarder' : 'Lire' }}
              </a>
            </div>

            <span
              class="disc-type-badge"
              :class="isAnime(item) ? 'badge-anime' : 'badge-manga'"
            >{{ isAnime(item) ? 'A' : 'M' }}</span>
          </div>

          <div class="disc-card-info">
            <p class="disc-card-title">{{ item.title }}</p>
            <p class="disc-card-chapter">
              {{ isAnime(item) ? 'Ép. ' + (item.lastEpisode || '—') : 'Ch. ' + (item.lastChapter || '—') }}
            </p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
@import url('./Discovery.css');
</style>

<script src="./Discovery.ts"></script>
