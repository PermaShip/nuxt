import type { SerializableHead } from '@unhead/vue'

export type { PageMeta, NuxtPageProps, NuxtLayouts } from '../pages/runtime/index'

export interface NuxtAppLiterals {
  [key: string]: string
}

export interface NuxtIslandSlotResponse {
  props: Array<unknown>
  fallback?: string
}

export interface NuxtIslandClientResponse {
  html: string
  props: unknown
  chunk: string
  slots?: Record<string, string>
  /** uid of the island that owns this client component (for nested islands) */
  uid?: string
  /** original component id within the owning island (for nested islands) */
  componentId?: string
}

export interface NuxtIslandContext {
  id?: string
  name: string
  props?: Record<string, any>
  url: string
  slots: Record<string, Omit<NuxtIslandSlotResponse, 'fallback'>>
  components: Record<string, Omit<NuxtIslandClientResponse, 'html'>>
}

export interface NuxtIslandResponse {
  id?: string
  html: string
  head: SerializableHead
  props?: Record<string, Record<string, any>>
  components?: Record<string, NuxtIslandClientResponse>
  slots?: Record<string, NuxtIslandSlotResponse>
}

export interface NuxtRenderHTMLContext {
  htmlAttrs: string[]
  head: string[]
  bodyAttrs: string[]
  bodyPrepend: string[]
  body: string[]
  bodyAppend: string[]
}
