export type ColourLightingPayload = {
  mode: 'colour'
  colour: string
}

export type RainbowLightingPayload = {
  mode: 'rainbow'
  speed: number
}

export type LightingPayload = ColourLightingPayload | RainbowLightingPayload

export type LightingMode = LightingPayload['mode']

export const isLightingPayload = (data: unknown): data is LightingPayload => {
  if (
    typeof data === 'object' &&
    data !== null &&
    'mode' in data &&
    (data as any).mode === 'colour' &&
    typeof (data as any).colour === 'string'
  ) {
    return true
  }
  if (
    typeof data === 'object' &&
    data !== null &&
    'mode' in data &&
    (data as any).mode === 'rainbow' &&
    typeof (data as any).speed === 'number'
  ) {
    return true
  }
  return false
}

export const defaultLightingPayloadByMode: Record<
  LightingMode,
  LightingPayload
> = {
  colour: {
    mode: 'colour',
    colour: '#ffff00',
  },
  rainbow: {
    mode: 'rainbow',
    speed: 5,
  },
}
