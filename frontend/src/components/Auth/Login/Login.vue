<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950 text-slate-800 dark:text-slate-100">
    <Menu />

    <div class="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
      <div class="w-full max-w-xl">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden">
          <div class="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-violet-500 text-white grid place-items-center font-semibold text-lg">
              🔐
            </div>
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide">{{ $t('auth.login_subtitle') }}</p>
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ $t('auth.login_heading') }}</h1>
            </div>
          </div>

          <div class="px-8 py-8">
            <Form @submit="handleLogin" :validation-schema="schema" class="space-y-6">
              <div class="space-y-2">
                <label for="login-email" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">{{ $t('auth.email') }}</label>
                <Field
                  id="login-email"
                  name="email"
                  autocomplete="email"
                  required
                  aria-required="true"
                  aria-describedby="login-email-error"
                  type="text"
                  class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                  :placeholder="$t('auth.email_placeholder')"
                />
                <ErrorMessage id="login-email-error" name="email" role="alert" class="text-sm text-red-600 dark:text-red-400" />
              </div>

              <div class="space-y-2">
                <label for="login-password" class="block text-sm font-semibold text-slate-700 dark:text-slate-300">{{ $t('auth.password') }}</label>
                <Field
                  id="login-password"
                  name="password"
                  autocomplete="current-password"
                  required
                  aria-required="true"
                  aria-describedby="login-password-error"
                  type="password"
                  class="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm"
                  placeholder="••••••••"
                />
                <ErrorMessage id="login-password-error" name="password" role="alert" class="text-sm text-red-600 dark:text-red-400" />
              </div>

              <div class="pt-2">
                <button
                  class="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-violet-600 text-white font-semibold py-3 shadow-lg shadow-violet-200 dark:shadow-none hover:bg-violet-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  :disabled="loading"
                >
                  <span v-show="loading" class="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
                  <span>{{ $t('auth.sign_in') }}</span>
                </button>
              </div>

              <div class="pt-2">
                <button
                  type="button"
                  @click="$router.push({ name: 'Register' })"
                  class="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  <span>{{ $t('auth.create_account') }}</span>
                </button>
              </div>

              <div v-if="message" role="alert" aria-live="assertive" class="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-3 text-sm">
                {{ message }}
              </div>
            </Form>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-slate-200 dark:border-white/10"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">{{ $t('auth.or_continue') }}</span>
                </div>
              </div>

              <div class="mt-6">
                <div id="google-signin-button"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./Login.ts"></script>
