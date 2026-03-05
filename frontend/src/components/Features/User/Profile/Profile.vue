<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Mon Profil</h1>
        <p class="text-slate-500 mt-1">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar -->
        <aside class="lg:w-72 flex-shrink-0">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center sticky top-6">
            <!-- Avatar -->
            <div class="w-20 h-20 rounded-full bg-indigo-500 text-white grid place-items-center text-3xl font-bold mx-auto mb-4 select-none">
              {{ userInitial }}
            </div>
            <h2 class="text-xl font-bold text-slate-900">{{ currentUser?.username || 'Utilisateur' }}</h2>
            <p class="text-sm text-slate-500 mt-1 break-all">{{ currentUser?.email || '—' }}</p>

            <!-- Roles -->
            <div class="mt-4 flex flex-wrap justify-center gap-2">
              <span
                v-for="role in userRoles"
                :key="role"
                class="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
              >
                {{ role }}
              </span>
              <span v-if="!userRoles.length" class="text-xs text-slate-400">Aucun rôle</span>
            </div>

            <!-- ID -->
            <div class="mt-6 pt-6 border-t border-slate-100 text-left">
              <p class="text-xs text-slate-400 uppercase tracking-wide font-semibold">Identifiant</p>
              <p class="text-sm font-mono text-slate-600 mt-1 break-all">{{ currentUser?.id || '—' }}</p>
            </div>

            <!-- Logout -->
            <button
              class="mt-6 w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition"
              @click="handleLogout"
            >
              Se déconnecter
            </button>
          </div>
        </aside>

        <!-- Main -->
        <main class="flex-1 space-y-6">

          <!-- Bandeau compte Google -->
          <div v-if="isGoogleUser" class="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>Votre compte est géré par Google. Le nom d'utilisateur et l'adresse email ne peuvent pas être modifiés ici, mais vous pouvez définir un nom d'affichage.</p>
          </div>

          <!-- Informations personnelles -->
          <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900">Informations personnelles</h3>
              <p class="text-sm text-slate-500 mt-0.5">Modifiez vos informations de compte</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="submitProfile">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nom d'utilisateur</label>
                <input
                  v-model="profileForm.username"
                  type="text"
                  autocomplete="username"
                  :disabled="isGoogleUser"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  placeholder="votre_pseudo"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Adresse email</label>
                <input
                  v-model="profileForm.email"
                  type="email"
                  autocomplete="email"
                  :disabled="isGoogleUser"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  placeholder="vous@exemple.com"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nom d'affichage</label>
                <input
                  v-model="profileForm.displayName"
                  type="text"
                  autocomplete="nickname"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  placeholder="Le nom affiché sur votre profil"
                />
                <p class="text-xs text-slate-400 mt-1">Visible par les autres utilisateurs. Laissez vide pour utiliser votre nom d'utilisateur.</p>
              </div>

              <div v-if="profileSuccess" class="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                {{ profileSuccess }}
              </div>
              <div v-if="profileError" class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {{ profileError }}
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="profileLoading"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {{ profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                </button>
              </div>
            </form>
          </section>

          <!-- Sécurité / Mot de passe -->
          <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-900">Sécurité</h3>
              <p class="text-sm text-slate-500 mt-0.5">{{ isGoogleUser ? 'Géré par Google' : 'Modifiez votre mot de passe' }}</p>
            </div>
            <form class="px-6 py-6 space-y-5" @submit.prevent="submitPassword">
              <!-- Message si compte Google -->
              <div v-if="isGoogleUser" class="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm">
                La gestion du mot de passe est assurée par Google.
              </div>

              <template v-if="!isGoogleUser">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe actuel</label>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  autocomplete="current-password"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nouveau mot de passe</label>
                  <input
                    v-model="passwordForm.newPassword"
                    type="password"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Confirmer le mot de passe</label>
                  <input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
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
                    :class="passwordStrength >= i ? passwordStrengthColor : 'bg-slate-200'"
                  ></div>
                </div>
                <p class="text-xs font-medium" :class="passwordStrength >= 3 ? 'text-green-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-500'">
                  {{ passwordStrengthLabel }}
                </p>
              </div>

              <div v-if="passwordSuccess" class="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                {{ passwordSuccess }}
              </div>
              <div v-if="passwordError" class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {{ passwordError }}
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="passwordLoading"
                  class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {{ passwordLoading ? 'Modification...' : 'Changer le mot de passe' }}
                </button>
              </div>
              </template>
            </form>
          </section>

          <!-- Zone de danger -->
          <section class="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div class="px-6 py-5 border-b border-red-100">
              <h3 class="text-lg font-bold text-red-600">Zone de danger</h3>
              <p class="text-sm text-slate-500 mt-0.5">Actions sur votre session</p>
            </div>
            <div class="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p class="font-semibold text-slate-800">Se déconnecter</p>
                <p class="text-sm text-slate-500">Terminer votre session en cours sur cet appareil</p>
              </div>
              <button
                class="px-6 py-2.5 rounded-xl border border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition flex-shrink-0"
                @click="handleLogout"
              >
                Se déconnecter
              </button>
            </div>
          </section>

        </main>
      </div>
    </div>
  </div>
</template>

<script src="./Profile.ts"></script>
