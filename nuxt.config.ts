// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  typescript: {
    shim: false
  },

  ssr: false,

  modules: ['@nuxt/ui', '@formkit/auto-animate/nuxt', '@nuxt/image'],

  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag === 'vue-silentbox'
    }
  },

  app: {
    compatibilityDate: '2024-10-20'
  }
})
