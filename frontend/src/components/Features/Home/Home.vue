<template>
  <Menu />

  <!-- HERO SECTION -->
  <section class="hero-section">
    <div class="hero-blob blob-1"></div>
    <div class="hero-blob blob-2"></div>
    <div class="hero-blob blob-3"></div>
    <div class="hero-particles">
      <span v-for="n in 20" :key="n" class="particle" :style="{ '--i': n }"></span>
    </div>
    <div class="hero-content">
      <p class="hero-eyebrow">Bienvenue sur OharaTracker</p>
      <h1 class="hero-title">
        <span class="word-reveal" style="--d: 0s">Explore</span>
        <span class="word-reveal" style="--d: 0.15s">l'univers</span>
        <span class="word-reveal" style="--d: 0.3s">du manga</span>
      </h1>
      <p class="hero-sub">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod
        nisi vel arcu volutpat, at sodales enim convallis. Vivamus tincidunt nunc ac
        libero aliquet, in dictum tortor vulputate.
      </p>
      <div class="hero-actions">
        <RouterLink to="/discovery"><button class="btn-primary">Commencer <span class="btn-arrow">→</span></button></RouterLink>
        <button class="btn-ghost">En savoir plus</button>
      </div>
    </div>
    <div class="hero-visual">
      <div class="glitch-box">
        <span class="glitch-text" data-text="OHARA">OHARA</span>
      </div>
      <div class="orbit-ring ring-1"></div>
      <div class="orbit-ring ring-2"></div>
      <div class="orbit-ring ring-3"></div>
      <div class="orbit-dot dot-1"></div>
      <div class="orbit-dot dot-2"></div>
      <div class="orbit-dot dot-3"></div>
    </div>
  </section>

  <!-- STATS SECTION -->
  <section class="stats-section">
    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, i) in stats" :key="i" :style="{ '--delay': i * 0.15 + 's' }">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-value counter">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-glow"></div>
      </div>
    </div>
  </section>

  <!-- FEATURES SECTION -->
  <section class="features-section">
    <div class="section-header">
      <span class="section-tag">Fonctionnalités</span>
      <h2 class="section-title">Tout ce dont vous avez besoin</h2>
      <p class="section-desc">
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
        minim veniam, quis nostrud exercitation ullamco laboris.
      </p>
    </div>
    <div class="features-grid">
      <div class="feature-card flip-card" v-for="(feat, i) in features" :key="i" :style="{ '--delay': i * 0.1 + 's' }">
        <div class="flip-inner">
          <div class="flip-front">
            <div class="feat-icon-wrap">
              <span class="feat-icon">{{ feat.icon }}</span>
            </div>
            <h3 class="feat-title">{{ feat.title }}</h3>
            <p class="feat-desc">{{ feat.desc }}</p>
          </div>
          <div class="flip-back">
            <p class="feat-back-text">{{ feat.detail }}</p>
            <button class="feat-btn">Explorer</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- TIMELINE SECTION -->
  <section class="timeline-section">
    <div class="section-header">
      <span class="section-tag">Dernières mises à jour</span>
      <h2 class="section-title">Ce qui se passe</h2>
    </div>
    <div class="timeline">
      <div class="timeline-item" v-for="(item, i) in timeline" :key="i" :style="{ '--delay': i * 0.12 + 's' }">
        <div class="timeline-dot">
          <div class="dot-inner"></div>
          <div class="dot-pulse"></div>
        </div>
        <div class="timeline-card">
          <span class="timeline-date">{{ item.date }}</span>
          <h4 class="timeline-title">{{ item.title }}</h4>
          <p class="timeline-text">{{ item.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- MARQUEE SECTION -->
  <div class="marquee-section">
    <div class="marquee-track">
      <span v-for="n in 2" :key="n">
        <span v-for="tag in marqueTags" :key="tag + n" class="marquee-item">{{ tag }}</span>
      </span>
    </div>
  </div>

  <!-- CTA SECTION -->
  <section class="cta-section">
    <div class="cta-bg-morph"></div>
    <div class="cta-content">
      <h2 class="cta-title">Prêt à commencer votre aventure ?</h2>
      <p class="cta-sub">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
        eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
      </p>
      <button class="btn-cta">
        <span class="cta-pulse"></span>
        Rejoindre maintenant
      </button>
    </div>
  </section>
</template>

<style scoped>
@import url('./Home.css');
</style>

<script src="./Home.ts"></script>
