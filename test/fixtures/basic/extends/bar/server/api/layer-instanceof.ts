import { LayerItem, checkLayerInstanceof } from '../../utils/layerInstanceof'

export default defineEventHandler(() => {
  const item = new LayerItem('test')
  return { isInstanceof: checkLayerInstanceof(item) }
})
