export class LayerItem {
  constructor (public value: string) {}
}

export function checkLayerInstanceof (obj: unknown): boolean {
  return obj instanceof LayerItem
}
