import { START_LOCATION } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

// Mock requestAnimationFrame for the test environment (not available in Node)
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  value: (cb: FrameRequestCallback) => { cb(0); return 0 },
  writable: true,
  configurable: true,
})

// Mock virtual modules used by router.options.ts
vi.mock('#app/nuxt', () => ({
  useNuxtApp: vi.fn(() => ({
    hooks: {
      hookOnce: (_event: string, cb: () => void) => { cb() },
    },
  })),
}))

vi.mock('#app/composables/router', () => ({
  useRouter: vi.fn(() => ({
    options: {},
  })),
}))

vi.mock('#app/components/utils', () => ({
  isChangingPage: vi.fn(() => true),
}))

import routerOptions from '../src/pages/runtime/router.options.ts'

// Shared component stubs for building route mocks
const parentComponentA = {}
const parentComponentB = {}
const childComponent1 = {}
const childComponent2 = {}

type MinimalMatchedRoute = { components?: { default?: object } }

function makeRoute (options: {
  path?: string
  hash?: string
  meta?: Record<string, unknown>
  matched?: MinimalMatchedRoute[]
}): RouteLocationNormalized {
  return {
    path: options.path ?? '/page',
    hash: options.hash ?? '',
    params: {},
    query: {},
    fullPath: options.path ?? '/page',
    name: undefined,
    meta: options.meta ?? {},
    redirectedFrom: undefined,
    matched: (options.matched ?? []) as RouteLocationNormalized['matched'],
  } as RouteLocationNormalized
}

const scrollBehavior = routerOptions.scrollBehavior!

describe('scrollBehavior – nested route guard (FR-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when navigating between nested routes sharing the same top-level parent component', () => {
    const from = makeRoute({
      path: '/parent/child1',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })
    const to = makeRoute({
      path: '/parent/child2',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent2 } },
      ],
    })

    const result = scrollBehavior(to, from, null)
    expect(result).toBe(false)
  })

  it('does not suppress scroll when top-level parent components differ (FR-6)', async () => {
    const from = makeRoute({
      path: '/page1',
      matched: [{ components: { default: parentComponentA } }],
    })
    const to = makeRoute({
      path: '/page2',
      matched: [{ components: { default: parentComponentB } }],
    })

    const result = await scrollBehavior(to, from, null)
    expect(result).toEqual({ left: 0, top: 0 })
  })

  it('does not suppress scroll when navigating between nested routes with different top-level parents', async () => {
    const from = makeRoute({
      path: '/parent1/child',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })
    const to = makeRoute({
      path: '/parent2/child',
      matched: [
        { components: { default: parentComponentB } },
        { components: { default: childComponent1 } },
      ],
    })

    const result = await scrollBehavior(to, from, null)
    expect(result).toEqual({ left: 0, top: 0 })
  })
})

describe('scrollBehavior – scrollToTop meta overrides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('scrolls to top when scrollToTop: true on a nested route even with same parent (FR-2)', async () => {
    const from = makeRoute({
      path: '/parent/child1',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })
    const to = makeRoute({
      path: '/parent/child2',
      meta: { scrollToTop: true },
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent2 } },
      ],
    })

    const result = await scrollBehavior(to, from, null)
    expect(result).toEqual({ left: 0, top: 0 })
  })

  it('returns false when scrollToTop: false on a nested route (FR-3)', () => {
    const from = makeRoute({
      path: '/parent/child1',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })
    const to = makeRoute({
      path: '/parent/child2',
      meta: { scrollToTop: false },
      matched: [
        { components: { default: parentComponentB } },
        { components: { default: childComponent2 } },
      ],
    })

    // scrollToTop: false always returns false regardless of parent
    const result = scrollBehavior(to, from, null)
    expect(result).toBe(false)
  })

  it('uses scrollToTop function result on a nested route (FR-4)', async () => {
    const from = makeRoute({
      path: '/parent/child1',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })
    // scrollToTop function returns true → should scroll
    const to = makeRoute({
      path: '/parent/child2',
      meta: { scrollToTop: () => true },
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent2 } },
      ],
    })

    const result = await scrollBehavior(to, from, null)
    expect(result).toEqual({ left: 0, top: 0 })
  })

  it('does not scroll when scrollToTop function returns false on a nested route (FR-4)', () => {
    const from = makeRoute({
      path: '/parent/child1',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })
    const to = makeRoute({
      path: '/parent/child2',
      meta: { scrollToTop: () => false },
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent2 } },
      ],
    })

    const result = scrollBehavior(to, from, null)
    expect(result).toBe(false)
  })
})

describe('scrollBehavior – back/forward (savedPosition) navigation (FR-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('restores savedPosition for nested routes when back/forward is used', async () => {
    const savedPosition = { left: 0, top: 200 }
    const from = makeRoute({
      path: '/parent/child1',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })
    const to = makeRoute({
      path: '/parent/child2',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent2 } },
      ],
    })

    const result = await scrollBehavior(to, from, savedPosition)
    expect(result).toEqual(savedPosition)
  })
})

describe('scrollBehavior – initial navigation (FR-8)', () => {
  it('does not apply nested guard on initial navigation from START_LOCATION', () => {
    const to = makeRoute({
      path: '/parent/child',
      matched: [
        { components: { default: parentComponentA } },
        { components: { default: childComponent1 } },
      ],
    })

    // START_LOCATION has an empty matched array and meta, so nested guard conditions are evaluated
    // but from === START_LOCATION causes the guard to be skipped
    const result = scrollBehavior(to, START_LOCATION, null)
    // On initial navigation, _calculatePosition is called → { left: 0, top: 0 }
    expect(result).toEqual({ left: 0, top: 0 })
  })
})

describe('scrollBehavior – undefined components.default guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not suppress scroll when both routes have undefined components.default', async () => {
    // Routes without a default component should fall through to normal behavior
    const from = makeRoute({
      path: '/parent/child1',
      matched: [
        { components: {} },
        { components: { default: childComponent1 } },
      ],
    })
    const to = makeRoute({
      path: '/parent/child2',
      matched: [
        { components: {} },
        { components: { default: childComponent2 } },
      ],
    })

    // to.matched[0].components.default is undefined → guard should not apply
    const result = await scrollBehavior(to, from, null)
    expect(result).toEqual({ left: 0, top: 0 })
  })
})

describe('scrollBehavior – hash navigation (FR-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves hash scroll behavior on same path', () => {
    const from = makeRoute({ path: '/page', hash: '#section1' })
    const to = makeRoute({ path: '/page', hash: '#section2' })

    const result = scrollBehavior(to, from, null)
    // Hash on same path → { el: '#section2', top: 0, behavior: 'auto' }
    expect(result).toMatchObject({ el: '#section2' })
  })

  it('scrolls to top when hash is removed on same path', () => {
    const from = makeRoute({ path: '/page', hash: '#section1' })
    const to = makeRoute({ path: '/page', hash: '' })

    const result = scrollBehavior(to, from, null)
    expect(result).toEqual({ left: 0, top: 0 })
  })
})
