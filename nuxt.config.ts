import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils'],
  css: [
    '@fontsource/prompt/thai-400.css',
    '@fontsource/prompt/latin-400.css',
    '@fontsource/prompt/thai-500.css',
    '@fontsource/prompt/latin-500.css',
    '@fontsource/prompt/thai-600.css',
    '@fontsource/prompt/latin-600.css',
    '@fontsource/prompt/thai-700.css',
    '@fontsource/prompt/latin-700.css',
    '~/assets/css/main.css',
  ],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  vite: {
    plugins: [
      tailwindcss()
    ]
  }
})
