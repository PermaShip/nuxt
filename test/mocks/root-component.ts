import { defineComponent } from 'vue'

// Minimal stub for #build/root-component.mjs
// NOTE: Must NOT return a render function from setup(), because mountSuspended()
// uses the return value as setup state and provides its own render (Suspense wrapper).
export default defineComponent({
  name: 'NuxtRoot',
  setup () {
    return {}
  },
})
