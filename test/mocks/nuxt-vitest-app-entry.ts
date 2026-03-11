// Minimal stub for nuxt-vitest-app-entry
// Sets up the unctx Nuxt app context needed for mountSuspended()

import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createHead } from '@unhead/vue/client'
import { applyPlugins, createNuxtApp, getNuxtAppCtx, tryUseNuxtApp, useNuxtApp } from '#app/nuxt'
import RootComponent from './root-component'

export default async function initNuxt () {
  const vueApp = createApp(RootComponent)

  // Install @unhead/vue so that injectHead() works inside NuxtIsland
  const head = createHead()
  vueApp.use(head)

  // Create a basic router for the nuxt app
  const router = createRouter({
    history: createMemoryHistory('/'),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  vueApp.use(router)

  const plugins: any[] = []
  // createNuxtApp with import.meta.client=true will pick up window.__NUXT__ automatically
  const nuxt = createNuxtApp({ vueApp })
  // Provide router on the nuxt instance
  nuxt.$router = router
  nuxt._route = router.currentRoute

  await applyPlugins(nuxt, plugins)
  await nuxt.hooks.callHook('app:created', vueApp)

  // Register the nuxt app in the unctx context (normally done via callWithNuxt in client mode)
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id)
  nuxtAppCtx.set(nuxt)

  // Make useNuxtApp available as a global (normally done by auto-imports at build time)
  ;(globalThis as any).useNuxtApp = useNuxtApp
  ;(globalThis as any).tryUseNuxtApp = tryUseNuxtApp
  return vueApp
}
