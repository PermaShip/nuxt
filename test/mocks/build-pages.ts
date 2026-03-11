// Mock for #build/pages - provides vue-router exports for nuxt app
// In a real nuxt build, this is generated at .nuxt/pages.mjs

import { START_LOCATION, createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useRoute as _useRoute, useRouter as _useRouter } from 'vue-router'

export { START_LOCATION, createRouter, createWebHistory, createMemoryHistory }
export { _useRoute as useRoute, _useRouter as useRouter }
