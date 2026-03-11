import { nextTick } from 'vue'
import { defineNuxtPlugin } from '#app/nuxt'
import { onNuxtReady } from '#app/composables/ready'
import { useError } from '#app/composables/error'
import { useRouter } from '#app/composables/router'

export default defineNuxtPlugin({
  name: 'nuxt:checkIfPageUnused',
  setup (nuxtApp) {
    const error = useError()
    const router = useRouter()

    function checkIfPageUnused () {
      if (!error.value && !nuxtApp._isNuxtPageUsed) {
        console.warn(
          '[nuxt] Your project has pages but the `<NuxtPage />` component has not been used.' +
          ' You might be using the `<RouterView />` component instead, which will not work correctly in Nuxt.' +
          ' You can set `pages: false` in `nuxt.config` if you do not wish to use the Nuxt `vue-router` integration.',
        )
      }
    }

    function checkIfNestedPageMissing () {
      if (error.value) { return }
      const route = router.currentRoute.value
      if (route.matched.length <= 1) { return }
      const instances = nuxtApp._nuxtPageInstances as Map<number, number> | undefined
      for (let d = 0; d < route.matched.length - 1; d++) {
        if (!instances?.get(d)) {
          console.warn(
            `[nuxt] Your nested route \`${route.fullPath}\` is not rendering because the parent route \`${route.matched[d]!.path}\` is missing \`<NuxtPage />\`.` +
            ' Add `<NuxtPage />` to the parent page component to render nested routes.',
          )
        }
      }
    }

    if (import.meta.server) {
      nuxtApp.hook('app:rendered', ({ renderResult }) => {
        if (renderResult?.html) {
          nextTick(() => {
            checkIfPageUnused()
            checkIfNestedPageMissing()
          })
        }
      })
    } else {
      onNuxtReady(() => {
        checkIfPageUnused()
        checkIfNestedPageMissing()
      })
      router.afterEach(() => { nextTick(checkIfNestedPageMissing) })
    }
  },
  env: {
    islands: false,
  },
})
