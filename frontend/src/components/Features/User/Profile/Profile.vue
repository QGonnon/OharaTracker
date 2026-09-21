<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <Menu />

    <div class="max-w-6xl mx-auto px-4 py-10">
      <!-- En-tête : identité du compte -->
      <header class="flex items-center gap-4 mb-8">
        <img v-if="avatarUrl" :src="avatarUrl" alt=""
             class="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
        <div v-else class="w-16 h-16 rounded-full bg-indigo-500 text-white grid place-items-center text-2xl font-bold select-none">
          {{ userInitial }}
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white truncate">
            {{ currentUser?.username }}<span class="text-slate-400 dark:text-slate-500 font-normal">#{{ currentUser?.code }}</span>
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 truncate">{{ currentUser?.email }}</p>
        </div>
        <span class="ml-auto px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex-shrink-0">
          {{ subscriptionName }}
        </span>
      </header>

      <div class="flex flex-col-reverse lg:flex-row gap-8">
        <!-- ══ Contenu ══ -->
        <div class="flex-1 min-w-0 space-y-6">

          <!-- Compte -->
          <section id="account" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden scroll-mt-24">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 class="text-lg font-bold">{{ $t('profile.personal_info') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.personal_info_sub') }}</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="submitProfile">
              <div>
                <label for="p-username" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.username') }}</label>
                <input id="p-username" v-model="profileForm.username" type="text" :placeholder="$t('profile.username_placeholder')"
                       class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label for="p-email" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.email') }}</label>
                <input id="p-email" v-model="profileForm.email" type="email" :disabled="isGoogleUser" :placeholder="$t('profile.email_placeholder')"
                       class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed" />
              </div>
              <p v-if="profileSuccess" role="status" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">{{ profileSuccess }}</p>
              <p v-if="profileError" role="alert" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{{ profileError }}</p>
              <div class="flex justify-end">
                <button type="submit" :disabled="profileLoading" class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition">
                  {{ profileLoading ? $t('profile.saving') : $t('profile.save') }}
                </button>
              </div>
            </form>
          </section>

          <!-- Sécurité -->
          <section id="security" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden scroll-mt-24">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 class="text-lg font-bold">{{ $t('profile.security') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.security_sub') }}</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="submitPassword">
              <div v-if="hasPassword">
                <label for="p-cur" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.current_password') }}</label>
                <input id="p-cur" v-model="passwordForm.currentPassword" type="password" autocomplete="current-password"
                       class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label for="p-new" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.new_password') }}</label>
                  <input id="p-new" v-model="passwordForm.newPassword" type="password" autocomplete="new-password"
                         class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label for="p-conf" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.confirm_password') }}</label>
                  <input id="p-conf" v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password"
                         class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
                </div>
              </div>
              <div v-if="passwordForm.newPassword" class="space-y-1.5">
                <div class="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <span class="block h-full rounded-full transition-all" :class="passwordStrengthColor" :style="{ width: (passwordStrength * 25) + '%' }"></span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('profile.strength_of') }} {{ passwordStrengthLabel }}</p>
              </div>
              <p v-if="passwordSuccess" role="status" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">{{ passwordSuccess }}</p>
              <p v-if="passwordError" role="alert" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{{ passwordError }}</p>
              <div class="flex justify-end">
                <button type="submit" :disabled="passwordLoading" class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition">
                  {{ passwordLoading ? $t('profile.changing') : $t('profile.change_password') }}
                </button>
              </div>
            </form>
          </section>

          <!-- Apparence -->
          <section id="appearance" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden scroll-mt-24">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 class="text-lg font-bold">{{ $t('profile.appearance') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.appearance_sub') }}</p>
            </div>

            <div v-if="!appearanceUnlocked" class="px-6 py-8 text-center">
              <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">{{ $t('profile.appearance_locked') }}</p>
              <RouterLink :to="pricingLink" class="inline-block px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition">
                {{ $t('profile.view_plans') }}
              </RouterLink>
            </div>

            <form v-else class="px-6 py-6 space-y-5" @submit.prevent="saveAppearance">
              <div class="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                <div class="h-24 bg-gradient-to-r from-violet-500 to-indigo-600 bg-cover bg-center"
                     :style="bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}"></div>
                <div class="flex items-center gap-3 px-4 py-3 -mt-8">
                  <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-800" />
                  <div v-else class="w-16 h-16 rounded-full bg-indigo-500 text-white grid place-items-center text-2xl font-bold border-4 border-white dark:border-slate-800">{{ userInitial }}</div>
                </div>
              </div>
              <div>
                <label for="p-avatar" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.avatar_url') }}</label>
                <input id="p-avatar" v-model="avatarUrl" type="url" :placeholder="$t('profile.image_placeholder')"
                       class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ $t('profile.avatar_hint') }}</p>
              </div>
              <div>
                <label for="p-banner" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.banner_url') }}</label>
                <input id="p-banner" v-model="bannerUrl" type="url" :placeholder="$t('profile.image_placeholder')"
                       class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label for="p-theme" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.theme') }}</label>
                <select id="p-theme" v-model="theme" class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm">
                  <option v-for="name in themes" :key="name" :value="name">{{ $t(`profile.themes.${name}`) }}</option>
                </select>
              </div>
              <p v-if="appearanceSuccess" role="status" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">{{ appearanceSuccess }}</p>
              <p v-if="appearanceError" role="alert" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{{ appearanceError }}</p>
              <div class="flex justify-end">
                <button type="submit" :disabled="appearanceLoading" class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition">
                  {{ appearanceLoading ? $t('profile.saving') : $t('profile.save') }}
                </button>
              </div>
            </form>
          </section>

          <!-- Notifications -->
          <section id="notifications" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden scroll-mt-24">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 class="text-lg font-bold">{{ $t('profile.notifications') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.notifications_sub') }}</p>
            </div>
            <div class="px-6 py-6 space-y-6">
              <!-- Push navigateur / mobile -->
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ $t('profile.push') }}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.push_desc') }}</p>
                  <p v-if="!pushStore.pushSupported" class="text-xs text-amber-700 dark:text-amber-400 mt-1">{{ $t('profile.push_unsupported') }}</p>
                  <p v-if="pushStore.pushError" role="alert" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ pushStore.pushError }}</p>
                </div>
                <button type="button" :disabled="!pushStore.pushSupported" @click="togglePush"
                        class="px-4 py-2 rounded-xl border text-sm font-semibold transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        :class="pushStore.pushEnabled
                          ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'">
                  {{ pushStore.pushEnabled ? $t('profile.push_on') : $t('profile.push_off') }}
                </button>
              </div>

              <hr class="border-slate-100 dark:border-slate-700" />

              <!-- Rapport hebdomadaire -->
              <form class="space-y-5" @submit.prevent="savePreferences">
                <div class="flex items-start justify-between gap-4">
                  <label for="p-digest" class="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {{ $t('profile.weekly_digest') }}
                    <span class="block font-normal text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.weekly_digest_desc') }}</span>
                  </label>
                  <input id="p-digest" v-model="emailDigestEnabled" type="checkbox" class="h-5 w-5 flex-shrink-0 accent-indigo-600 cursor-pointer mt-1" />
                </div>

                <div>
                  <label for="p-day" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {{ $t('profile.digest_day') }}
                    <span v-if="!canChooseDigestDay" class="ml-2 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold">Pro</span>
                  </label>
                  <select id="p-day" v-model.number="emailDigestDay" :disabled="!canChooseDigestDay || !emailDigestEnabled"
                          class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed">
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

                <p v-if="preferencesSuccess" role="status" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">{{ preferencesSuccess }}</p>
                <p v-if="preferencesError" role="alert" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{{ preferencesError }}</p>
                <div class="flex justify-end">
                  <button type="submit" :disabled="preferencesLoading" class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition">
                    {{ preferencesLoading ? $t('profile.saving') : $t('profile.save') }}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <!-- Préférences -->
          <section id="preferences" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden scroll-mt-24">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 class="text-lg font-bold">{{ $t('profile.preferences') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.preferences_sub') }}</p>
            </div>
            <div class="px-6 py-6 space-y-6">
              <div>
                <label for="p-locale" class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.language') }}</label>
                <select id="p-locale" v-model="accountLocale" @change="savePreferences"
                        class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm">
                  <option v-for="code in availableLocales" :key="code" :value="code">{{ $t(`profile.languages.${code}`) }}</option>
                </select>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{{ $t('profile.language_hint') }}</p>
              </div>

              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ $t('profile.visibility') }}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.visibility_desc') }}</p>
                </div>
                <button type="button" @click="toggleVisibility"
                        class="px-4 py-2 rounded-xl border text-sm font-semibold transition flex-shrink-0"
                        :class="profilePublic
                          ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'">
                  {{ profilePublic ? $t('profile.visibility_public') : $t('profile.visibility_private') }}
                </button>
              </div>
            </div>
          </section>

          <!-- Offre -->
          <section id="plan" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden scroll-mt-24">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h2 class="text-lg font-bold">{{ $t('profile.subscription') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.subscription_sub') }}</p>
            </div>
            <div class="px-6 py-6 space-y-5">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ $t('profile.current_plan') }}</span>
                <span class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">{{ subscriptionName }}</span>
              </div>

              <!-- Ce que l'offre inclut réellement -->
              <ul v-if="features" class="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                <li v-for="item in features.content" :key="item.key" class="flex items-center gap-2 text-sm">
                  <i class="pi text-xs flex-shrink-0" :class="item.included ? 'pi-check text-green-600 dark:text-green-400' : 'pi-minus text-slate-300 dark:text-slate-600'" aria-hidden="true"></i>
                  <span :class="item.included ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'">
                    {{ $t(`profile.plan_item.${item.key}`) }}
                    <template v-if="item.kind === 'quota' && item.included">
                      — {{ item.value === null ? $t('profile.unlimited') : item.value }}
                    </template>
                  </span>
                </li>
              </ul>

              <p v-if="subscriptionError" role="alert" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{{ subscriptionError }}</p>

              <div v-if="hasActiveStripeSubscription" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('profile.manage_subscription_desc') }}</p>
                <button :disabled="portalLoading" @click="toStripePortalManageSubscription"
                        class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition flex-shrink-0">
                  {{ portalLoading ? $t('profile.opening_portal') : $t('profile.manage_subscription') }}
                </button>
              </div>
              <div v-else class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('profile.no_subscription') }}</p>
                <RouterLink :to="pricingLink" class="inline-block px-6 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition flex-shrink-0">
                  {{ $t('profile.view_plans') }}
                </RouterLink>
              </div>
            </div>
          </section>

          <!-- Zone danger -->
          <section id="danger" class="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden scroll-mt-24">
            <div class="px-6 py-5 border-b border-red-100 dark:border-red-900/50">
              <h2 class="text-lg font-bold text-red-700 dark:text-red-400">{{ $t('profile.danger_zone') }}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.danger_sub') }}</p>
            </div>
            <div class="px-6 py-6 space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ $t('profile.logout_title') }}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.logout_description') }}</p>
                </div>
                <button type="button" @click="logout"
                        class="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex-shrink-0">
                  {{ $t('profile.logout') }}
                </button>
              </div>

              <hr class="border-red-100 dark:border-red-900/50" />

              <div>
                <p class="text-sm font-semibold text-red-700 dark:text-red-400">{{ $t('profile.delete_title') }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 mb-3">{{ $t('profile.delete_description') }}</p>
                <label for="p-delete" class="block text-sm text-slate-600 dark:text-slate-300 mb-1.5">
                  {{ $t('profile.delete_confirm_label', { name: currentUser?.username }) }}
                </label>
                <div class="flex flex-col sm:flex-row gap-3">
                  <input id="p-delete" v-model="deleteConfirm" type="text" autocomplete="off" :placeholder="currentUser?.username"
                         class="flex-1 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm" />
                  <button type="button" :disabled="!deleteArmed || deleteLoading" @click="deleteAccount"
                          class="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0">
                    {{ deleteLoading ? $t('profile.deleting') : $t('profile.delete_account') }}
                  </button>
                </div>
                <p v-if="deleteError" role="alert" class="mt-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{{ deleteError }}</p>
              </div>
            </div>
          </section>
        </div>

        <!-- ══ Navigation persistante (à droite) ══ -->
        <nav class="lg:w-56 flex-shrink-0" :aria-label="$t('profile.settings_nav')">
          <ul class="lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            <li v-for="id in sections" :key="id">
              <button type="button" @click="goToSection(id)"
                      class="w-full text-left whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition border-l-2"
                      :class="activeSection === id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-500'
                        : 'text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'">
                {{ $t(`profile.nav.${id}`) }}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script src="./Profile.ts"></script>
