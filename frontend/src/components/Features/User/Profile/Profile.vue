<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
    <Menu />

    <div class="max-w-6xl mx-auto px-4 py-16">
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="lg:w-2/3">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div class="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-indigo-500 text-white grid place-items-center text-xl font-bold">
                {{ currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <div>
                <p class="text-sm text-slate-500 uppercase tracking-wide">Profil</p>
                <h2 class="text-2xl font-bold">{{ currentUser?.username || 'Utilisateur' }}</h2>
                <p class="text-sm text-slate-500">{{ currentUser?.email || 'Email non renseigné' }}</p>
              </div>
            </div>

            <div class="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p class="text-xs uppercase tracking-wide text-slate-500 font-semibold">ID</p>
                <p class="mt-1 font-semibold text-slate-900">{{ currentUser?.id || '—' }}</p>
              </div>

              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p class="text-xs uppercase tracking-wide text-slate-500 font-semibold">Token</p>
                <p class="mt-1 font-mono text-sm text-slate-700 break-all">
                  {{ currentUser?.accessToken ? currentUser.accessToken.substring(0, 28) + '…' + currentUser.accessToken.substring(currentUser.accessToken.length - 12) : '—' }}
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <p class="text-xs uppercase tracking-wide text-slate-500 font-semibold">Rôles</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <span
                    v-for="role in (currentUser?.roles || [])"
                    :key="role"
                    class="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {{ role }}
                  </span>
                  <span v-if="!currentUser?.roles || !currentUser.roles.length" class="text-slate-500 text-sm">Aucun rôle</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:w-1/3">
          <div class="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4">
            <h3 class="text-lg font-bold text-slate-900">Actions rapides</h3>
            <button
              class="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold py-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
              @click="$router.push({ name: 'Home' })"
            >
              Retour à l'accueil
            </button>
            <button
              class="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 text-slate-800 font-semibold py-3 hover:border-indigo-200 hover:bg-indigo-50 transition"
              @click="$router.push({ name: 'User' })"
            >
              Voir tableau utilisateur
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Profile.ts"></script>
