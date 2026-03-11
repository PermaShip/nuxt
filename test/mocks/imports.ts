// Mock for #imports - provides auto-imported composables used in tests
export {
  defineComponent,
  h,
  ref,
  computed,
  reactive,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  nextTick,
  shallowRef,
  toRaw,
} from 'vue'
export { tryUseNuxtApp, useNuxtApp } from '#app/nuxt'

// Stub out router composables that may be imported
export const useRouter = () => ({
  resolve: (to: any) => ({ href: typeof to === 'string' ? to : to.path || '/' }),
  push: () => Promise.resolve(),
  replace: () => Promise.resolve(),
})
export const useRoute = () => ({
  path: '/',
  params: {},
  query: {},
  hash: '',
  meta: {},
})
