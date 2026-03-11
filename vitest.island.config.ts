import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { defaultExclude, defineConfig } from 'vitest/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const r = (...p: string[]) => join(__dirname, ...p)

function metaReplacementPlugin () {
  return {
    name: 'nuxt-meta-replacement',
    enforce: 'pre' as const,
    transform (code: string, id: string) {
      // Only transform TS/JS files in our packages and test directories
      if (!id.endsWith('.ts') && !id.endsWith('.js') && !id.endsWith('.mjs') && !id.endsWith('.cjs')) { return }
      if (id.includes('node_modules') && !id.includes('@nuxt/test-utils')) { return }
      // Replace import.meta.client and import.meta.server
      let transformed = code
      transformed = transformed.replaceAll('import.meta.client', 'true')
      transformed = transformed.replaceAll('import.meta.server', 'false')
      transformed = transformed.replaceAll('import.meta.prerender', 'false')
      transformed = transformed.replaceAll('import.meta.dev', 'globalThis.__TEST_DEV__')
      if (transformed !== code) {
        return { code: transformed, map: null }
      }
    },
  }
}

function importsPlugin () {
  return {
    name: 'resolve-hash-imports',
    enforce: 'pre' as const,
    resolveId (id: string) {
      if (id === '#imports') {
        return r('test/mocks/imports.ts')
      }
      if (id === '#unhead/composables') {
        return r('packages/nuxt/src/head/runtime/composables.ts')
      }
      if (id === '#build/pages') {
        return r('test/mocks/build-pages.ts')
      }
      if (id === '#pages/composables') {
        return r('packages/nuxt/src/pages/runtime/composables.ts')
      }
      // nuxt-vitest-app-entry: use a minimal stub that sets up nuxt unctx context
      if (id.includes('nuxt-vitest-app-entry')) {
        return r('test/mocks/nuxt-vitest-app-entry.ts')
      }
      // root-component: mountSuspended() calls NuxtRoot.setup(), so it must be a real component
      if (id === '#build/root-component.mjs') {
        return r('test/mocks/root-component.ts')
      }
      // Catch all remaining #build/ specifiers and #app/ sub-paths
      if (id.startsWith('#build/') || id.startsWith('#internal/') || id.startsWith('#app-')) {
        return r('test/mocks/build-stub.ts')
      }
    },
  }
}

// Minimal config to run nuxt-island tests without requiring a full nuxt build.
// This bypasses the normal defineVitestProject() which requires a built nuxt package.
export default defineConfig({
  plugins: [metaReplacementPlugin(), importsPlugin()],
  resolve: {
    alias: {
      '#build/nuxt.config.mjs': r('test/mocks/nuxt-config.ts'),
      '#build/router.options.mjs': r('test/mocks/router-options.ts'),
      '#internal/nuxt/paths': r('test/mocks/paths.ts'),
      '#build/app.config.mjs': r('test/mocks/app-config.ts'),
      '#app': r('packages/nuxt/src/app'),
      'nuxt/app': r('packages/nuxt/src/app'),
      '@vue/devtools-kit': r('test/mocks/vue-devtools.ts'),
      '@vue/devtools-core': r('test/mocks/vue-devtools.ts'),
      'vue-router': r('node_modules/.pnpm/vue-router@5.0.3_@vue+compiler-sfc@3.5.30_vue@3.5.30_typescript@5.9.3_/node_modules/vue-router'),
    },
  },
  define: {
    'import.meta.dev': 'globalThis.__TEST_DEV__',
    'import.meta.client': 'true',
    'import.meta.server': 'false',
    'process.env.NODE_ENV': '"test"',
    '__NUXT_ASYNC_CONTEXT__': 'false',
  },
  test: {
    name: 'island-unit',
    environment: 'nuxt',
    include: ['test/nuxt/nuxt-island.test.ts'],
    exclude: [...defaultExclude],
    setupFiles: [
      // This is what defineVitestProject normally adds - runs setupNuxt() via beforeAll
      './node_modules/.pnpm/@nuxt+test-utils@4.0.0_@playwright+test@1.58.2_@testing-library+vue@8.1.0_@vue+compiler_6127fb25685693eeb7418e2143e30156/node_modules/@nuxt/test-utils/dist/runtime/entry.mjs',
      './test/setup-runtime.ts',
    ],
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    server: {
      deps: {
        inline: [
          // Process all #specifiers through Vite (resolves #imports etc)
          /^#/,
          '@nuxt/test-utils',
          'vitest-environment-nuxt',
          /\/node_modules\/(.*\/)?(nuxt|nuxt3)\//,
          // Process workspace packages through Vite so define replacements apply
          /\/packages\//,
          /\/test\/mocks\//,
        ],
      },
    },
  },
})
