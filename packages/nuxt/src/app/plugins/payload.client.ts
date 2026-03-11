import { defineNuxtPlugin } from '../nuxt'
import { loadPayload } from '../composables/payload'
import { onNuxtReady } from '../composables/ready'
import { useRouter } from '../composables/router'
import { getAppManifest } from '../composables/manifest'

// @ts-expect-error virtual file
import { appManifest as isAppManifestEnabled, purgeCachedData } from '#build/nuxt.config.mjs'

export default defineNuxtPlugin({
  name: 'nuxt:payload',
  setup (nuxtApp) {
    // Cache for payloads prefetched via link:prefetch hook
    const prefetchedPayloads = new Map<string, Record<string, any>>()

    // Load payload after middleware & once final route is resolved
    const staticKeysToRemove = new Set<string>()
    useRouter().beforeResolve(async (to, from) => {
      if (to.path === from.path) { return }
      const payload = prefetchedPayloads.get(to.path) || await loadPayload(to.path)
      if (prefetchedPayloads.has(to.path)) {
        prefetchedPayloads.delete(to.path)
      }
      if (!payload) { return }
      if (purgeCachedData) {
        for (const key of staticKeysToRemove) {
          delete nuxtApp.static.data[key]
        }
      }
      for (const key in payload.data) {
        if (purgeCachedData) {
          if (!(key in nuxtApp.static.data)) {
            staticKeysToRemove.add(key)
          }
        }
        nuxtApp.static.data[key] = payload.data[key]
      }
    })

    onNuxtReady(() => {
      // Load payload into cache
      nuxtApp.hooks.hook('link:prefetch', async (url) => {
        const { hostname, pathname } = new URL(url, window.location.href)
        if (hostname === window.location.hostname) {
          // TODO: use preloadPayload instead once we can support preloading islands too
          const payload = await loadPayload(url).catch(() => { console.warn('[nuxt] Error preloading payload for', url) })
          if (payload) {
            prefetchedPayloads.set(pathname, payload)
          }
        }
      })
      if (isAppManifestEnabled && navigator.connection?.effectiveType !== 'slow-2g') {
        setTimeout(getAppManifest, 1000)
      }
    })
  },
})
