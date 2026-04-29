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
        <main class="flex-1 space-y-6">

          <!-- Informations personnelles -->
          <section class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('profile.personal_info') }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('profile.personal_info_sub') }}</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="submitProfile">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.username') }}</label>
                <input
                  v-model="profileForm.username"
                  type="text"
                  autocomplete="username"
                  class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  :placeholder="$t('profile.username_placeholder')"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.email') }}</label>
                <input
                  v-model="profileForm.email"
                  type="email"
                  autocomplete="email"
                  class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                  :placeholder="$t('profile.email_placeholder')"
                />
              </div>

              <div v-if="profileSuccess" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {{ profileSuccess }}
              </div>
              <div v-if="profileError" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
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
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.current_password') }}</label>
                  <input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    autocomplete="current-password"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
              </template>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.new_password') }}</label>
                  <input
                    v-model="passwordForm.newPassword"
                    type="password"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ $t('profile.confirm_password') }}</label>
                  <input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
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
                <p class="text-xs font-medium" :class="passwordStrength >= 3 ? 'text-green-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-500'">
                  {{ passwordStrengthLabel }}
                </p>
              </div>

              <div v-if="passwordSuccess" class="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
                {{ passwordSuccess }}
              </div>
              <div v-if="passwordError" class="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
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

        </main>
      </div>
    </div>
  </div>
</template>

<script src="./Profile.ts"></script>
