<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{{ $t('profile.title') }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">{{ $t('profile.subtitle') }}</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar -->
        <aside class="lg:w-72 flex-shrink-0">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 text-center sticky top-6">
            <!-- Avatar -->
            <div class="w-20 h-20 rounded-full bg-indigo-500 text-white grid place-items-center text-3xl font-bold mx-auto mb-4 select-none">
              {{ userInitial }}
            </div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ `${currentUser?.username || 'Utilisateur'}#${currentUser?.code}` }}</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 break-all">{{ currentUser?.email }}</p>

            <!-- Logout -->
            <button
              class="mt-6 w-full py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition"
              @click="handleLogout"
            >
              {{ $t('profile.logout') }}
            </button>
          </div>
        </aside>

        <!-- Main -->
        <div class="flex-1 space-y-6">

          <!-- Informations personnelles -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('profile.personal_info') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.personal_info_sub') }}</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="submitProfile">
              <div>
                <label for="profile-username" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.username') }}</label>
                <input
                  id="profile-username"
                  v-model="profileForm.username"
                  type="text"
                  autocomplete="username"
                  class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  :placeholder="$t('profile.username_placeholder')"
                />
              </div>
              <div>
                <label for="profile-email" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.email') }}</label>
                <input
                  id="profile-email"
                  v-model="profileForm.email"
                  type="email"
                  autocomplete="email"
                  class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  :placeholder="$t('profile.email_placeholder')"
                />
              </div>

              <div v-if="profileSuccess" role="status" aria-live="polite" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {{ profileSuccess }}
              </div>
              <div v-if="profileError" role="alert" aria-live="assertive" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {{ profileError }}
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="profileLoading"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {{ profileLoading ? $t('profile.saving') : $t('profile.save') }}
                </button>
              </div>
            </form>
          </section>

          <!-- Sécurité -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('profile.security') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.security_sub') }}</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="submitPassword">
              <template v-if="hasPassword">
                <div>
                  <label for="profile-current-password" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.current_password') }}</label>
                  <input
                    id="profile-current-password"
                    v-model="passwordForm.currentPassword"
                    type="password"
                    autocomplete="current-password"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
              </template>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label for="profile-new-password" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.new_password') }}</label>
                  <input
                    id="profile-new-password"
                    v-model="passwordForm.newPassword"
                    type="password"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label for="profile-confirm-password" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.confirm_password') }}</label>
                  <input
                    id="profile-confirm-password"
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <!-- Password strength -->
              <div v-if="passwordForm.newPassword" class="space-y-1.5">
                <div class="flex gap-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="h-1 flex-1 rounded-full transition-all duration-300"
                    :class="passwordStrength >= i ? passwordStrengthColor : 'bg-slate-200 dark:bg-slate-600'"
                  ></div>
                </div>
                <p class="text-xs font-medium" :class="passwordStrength >= 3 ? 'text-green-700' : passwordStrength >= 2 ? 'text-amber-700' : 'text-red-500'">
                  {{ passwordStrengthLabel }}
                </p>
              </div>

              <div v-if="passwordSuccess" role="status" aria-live="polite" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {{ passwordSuccess }}
              </div>
              <div v-if="passwordError" role="alert" aria-live="assertive" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {{ passwordError }}
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="passwordLoading"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {{ passwordLoading ? $t('profile.changing') : $t('profile.change_password') }}
                </button>
              </div>
            </form>
          </section>

          <!-- Apparence -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('profile.appearance') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.appearance_sub') }}</p>
            </div>

            <div v-if="!appearanceUnlocked" class="px-6 py-6 text-center">
              <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">{{ $t('profile.appearance_locked') }}</p>
              <RouterLink :to="pricingLink" class="inline-block px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition">
                {{ $t('profile.view_plans') }}
              </RouterLink>
            </div>

            <form v-else class="px-6 py-6 space-y-5" @submit.prevent="saveAppearance">
              <!-- Aperçu -->
              <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                <div class="h-24 bg-gradient-to-r from-violet-500 to-indigo-600 bg-cover bg-center"
                     :style="bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}"></div>
                <div class="flex items-center gap-3 px-4 py-3 -mt-8">
                  <img v-if="avatarUrl" :src="avatarUrl" alt=""
                       class="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-800" />
                  <div v-else class="w-16 h-16 rounded-full bg-indigo-500 text-white grid place-items-center text-2xl font-bold border-4 border-white dark:border-slate-800">
                    {{ userInitial }}
                  </div>
                </div>
              </div>

              <div>
                <label for="profile-avatar" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.avatar_url') }}</label>
                <input id="profile-avatar" v-model="avatarUrl" type="url" :placeholder="$t('profile.image_placeholder')"
                       class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ $t('profile.avatar_hint') }}</p>
              </div>

              <div>
                <label for="profile-banner" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.banner_url') }}</label>
                <input id="profile-banner" v-model="bannerUrl" type="url" :placeholder="$t('profile.image_placeholder')"
                       class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
              </div>

              <div>
                <label for="profile-theme" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.theme') }}</label>
                <select id="profile-theme" v-model="theme"
                        class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm">
                  <option v-for="name in themes" :key="name" :value="name">{{ $t(`profile.themes.${name}`) }}</option>
                </select>
              </div>

              <div v-if="appearanceSuccess" role="status" aria-live="polite" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {{ appearanceSuccess }}
              </div>
              <div v-if="appearanceError" role="alert" aria-live="assertive" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {{ appearanceError }}
              </div>

              <div class="flex justify-end">
                <button type="submit" :disabled="appearanceLoading"
                        class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition">
                  {{ appearanceLoading ? $t('profile.saving') : $t('profile.save') }}
                </button>
              </div>
            </form>
          </section>

          <!-- Notifications -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('profile.notifications') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.notifications_sub') }}</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="savePreferences">
              <div class="flex items-center justify-between gap-4">
                <label for="profile-digest-enabled" class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {{ $t('profile.weekly_digest') }}
                  <span class="block font-normal text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.weekly_digest_desc') }}</span>
                </label>
                <input
                  id="profile-digest-enabled"
                  v-model="emailDigestEnabled"
                  type="checkbox"
                  class="h-5 w-5 flex-shrink-0 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label for="profile-digest-day" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {{ $t('profile.digest_day') }}
                  <span v-if="!canChooseDigestDay" class="ml-2 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold">Pro</span>
                </label>
                <select
                  id="profile-digest-day"
                  v-model.number="emailDigestDay"
                  :disabled="!canChooseDigestDay || !emailDigestEnabled"
                  class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <option :value="0">{{ $t('profile.days.sunday') }}</option>
                  <option :value="1">{{ $t('profile.days.monday') }}</option>
                  <option :value="2">{{ $t('profile.days.tuesday') }}</option>
                  <option :value="3">{{ $t('profile.days.wednesday') }}</option>
                  <option :value="4">{{ $t('profile.days.thursday') }}</option>
                  <option :value="5">{{ $t('profile.days.friday') }}</option>
                  <option :value="6">{{ $t('profile.days.saturday') }}</option>
                </select>
                <p v-if="!canChooseDigestDay" class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{{ $t('profile.digest_day_locked') }}</p>
              </div>

              <div v-if="preferencesSuccess" role="status" aria-live="polite" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {{ preferencesSuccess }}
              </div>
              <div v-if="preferencesError" role="alert" aria-live="assertive" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {{ preferencesError }}
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="preferencesLoading"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {{ preferencesLoading ? $t('profile.saving') : $t('profile.save') }}
                </button>
              </div>
            </form>
          </section>

          <!-- Abonnement -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('profile.subscription') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.subscription_sub') }}</p>
            </div>
            <div class="px-6 py-6 space-y-5">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ $t('profile.current_plan') }}</span>
                <span class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                  {{ subscriptionName }}
                </span>
              </div>

              <div v-if="subscriptionError" role="alert" aria-live="assertive" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {{ subscriptionError }}
              </div>

              <div v-if="hasActiveStripeSubscription" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('profile.manage_subscription_desc') }}</p>
                <button
                  :disabled="portalLoading"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition flex-shrink-0"
                  @click="toStripePortalManageSubscription"
                >
                  {{ portalLoading ? $t('profile.opening_portal') : $t('profile.manage_subscription') }}
                </button>
              </div>
              <div v-else class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('profile.no_subscription') }}</p>
                <RouterLink
                  :to="pricingLink"
                  class="inline-block px-6 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition flex-shrink-0"
                >
                  {{ $t('profile.view_plans') }}
                </RouterLink>
              </div>
            </div>
          </section>

          <!-- Zone de danger -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 overflow-hidden">
            <div class="px-6 py-5 border-b border-red-100 dark:border-red-900/50">
              <h3 class="text-lg font-bold text-red-600 dark:text-red-400">{{ $t('profile.danger_zone') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.danger_sub') }}</p>
            </div>
            <div class="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p class="font-semibold text-slate-800 dark:text-slate-100">{{ $t('profile.logout_title') }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('profile.logout_description') }}</p>
              </div>
              <button
                class="px-6 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition flex-shrink-0"
                @click="handleLogout"
              >
                {{ $t('profile.logout') }}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Profile.ts"></script>
