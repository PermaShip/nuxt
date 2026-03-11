export default defineEventHandler(() => {
  return {
    // @ts-expect-error - using for test ordering
    order: useNitroApp()._nitroPluginOrder ?? [],
  }
})
