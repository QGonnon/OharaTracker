<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
      <div class="w-full max-w-xl">
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div class="px-8 pt-8 pb-6 border-b border-slate-100 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-indigo-500 text-white grid place-items-center font-semibold text-lg">
              ✨
            </div>
            <div>
              <p class="text-sm text-slate-500 uppercase tracking-wide">Inscription</p>
              <h1 class="text-2xl font-bold text-slate-900">Rejoins-nous</h1>
            </div>
          </div>

          <div class="px-8 py-8">
            <Form @submit="handleRegister" :validation-schema="schema" class="space-y-8">
              <div v-if="!successful" class="space-y-8">
                <div class="space-y-2">
                  <label for="username" class="block text-sm font-semibold text-slate-700">Nom d'utilisateur</label>
                  <Field
                    name="username"
                    type="text"
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    placeholder="Votre pseudo"
                  />
                  <ErrorMessage name="username" class="text-sm text-red-600" />
                </div>

                <div class="space-y-2">
                  <label for="email" class="block text-sm font-semibold text-slate-700">Email</label>
                  <Field
                    name="email"
                    type="email"
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    placeholder="votre@email.com"
                  />
                  <ErrorMessage name="email" class="text-sm text-red-600" />
                </div>

                <div class="space-y-2">
                  <label for="password" class="block text-sm font-semibold text-slate-700">Mot de passe</label>
                  <Field
                    name="password"
                    type="password"
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    placeholder="••••••••"
                  />
                  <ErrorMessage name="password" class="text-sm text-red-600" />
                </div>

                <div class="pt-2">
                  <button
                    class="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold py-3 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    :disabled="loading"
                  >
                    <span v-show="loading" class="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
                    <span>S'inscrire</span>
                  </button>
                </div>

                <div class="pt-2">
                  <button
                    type="button"
                    @click="$router.push('/login')"
                    class="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-slate-200 text-slate-700 font-semibold py-3 hover:bg-slate-300 transition"
                  >
                    <span>Déjà inscrit ? Se connecter</span>
                  </button>
                </div>
              </div>
            </Form>

            <div
              v-if="message"
              class="rounded-xl"
              :class="successful ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'"
            >
              <p class="px-4 py-3 text-sm">{{ message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Register.ts"></script>
