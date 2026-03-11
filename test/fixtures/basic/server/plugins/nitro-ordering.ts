export default defineNitroPlugin((nitroApp) => {
  // @ts-expect-error - using for test ordering
  nitroApp._nitroPluginOrder ||= []
  // @ts-expect-error
  nitroApp._nitroPluginOrder.push('root')
})
