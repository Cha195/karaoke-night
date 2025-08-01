import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  css: ["./assets/css/main.css"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/image",
    "@nuxt/icon",
    "@pinia/nuxt",
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    viewTransition: true,
  },
  nitro: {
    experimental: {
      websocket: true,
    },
  },
});
