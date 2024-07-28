// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
    typescript: {
        shim: false,
    },

    ssr: false,
    modules: [
      "@nuxt/ui",
      "@formkit/auto-animate/nuxt",
      "@nuxt/image",
    ],

    vue: {
      compilerOptions: {
          isCustomElement: tag => tag === 'vue-silentbox'
      }
    },
});