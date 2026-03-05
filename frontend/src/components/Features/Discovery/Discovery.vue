<template>
  <Menu />

  <section class="container py-10">
    <Carousel v-model:page="currentPage" :value="featuredMangas" :numVisible="7" :numScroll="1" :responsiveOptions="responsiveOptions" circular :autoplayInterval="5000" :showIndicators="false" :showNavigators="false" class="w-screen">
      <template #item="slotProps">
        <div :class="['carousel-card border border-surface-200 dark:border-surface-700 rounded m-2 p-4', { 'is-center': slotProps.index === centerIndex }]">
            <div class="mb-4">
                <div class="aspect-[3/4] overflow-hidden relative">
                  <RouterLink :to="`/manga/${slugify(slotProps.data.title)}`" :class="slotProps.class">
                    <img :src="slotProps.data.coverUrl" :alt="slotProps.data.title" class="w-full h-full object-cover hover:scale-110 transition-transform duration-300 bg-slate-100 dark:bg-slate-700 rounded-md" />
                  </RouterLink>
                  <div class="card-shadow absolute inset-0 pointer-events-none"></div>
                  <div class="card-title-overlay pointer-events-none">{{ slotProps.data.title }}</div>
                </div>
            </div>
        </div>        
      </template>
    </Carousel>
  </section>
  
  
  <section class="home-hero container mx-auto lg:py-20 py-12">
    <div class="hero-inner max-w-6xl mx-auto text-center">
      <h1 class="hero-title text-4xl font-extrabold mb-4">Découvrez les dernières sorties</h1>
      <p class="hero-sub text-lg mb-6"></p>
    </div>
  </section>

  
  
</template>
<style scoped>
@import url('./Discovery.css');
</style>

<script src="./Discovery.ts"></script>
