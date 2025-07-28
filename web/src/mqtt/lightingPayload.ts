export type ColourLightingPayload = {
  mode: 'colour'
  colour: string
}
export type RainbowLightingPayload = {
  mode: 'rainbow'
  speed: number
}
export type StrobeLightingPayload = {
  mode: 'strobe'
  colour: string
  speed: number
}
export type LightingPayload =
  | ColourLightingPayload
  | RainbowLightingPayload
  | StrobeLightingPayload

export type LightingMode = LightingPayload['mode']

export const isLightingPayload = (data: unknown): data is LightingPayload => {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as any).mode !== 'string'
  ) {
    return false
  }
  if ((data as any).mode === 'colour') {
    return typeof (data as any).colour === 'string'
  }
  if ((data as any).mode === 'rainbow') {
    return typeof (data as any).speed === 'number'
  }
  if ((data as any).mode === 'strobe') {
    return (
      typeof (data as any).colour === 'string' &&
      typeof (data as any).speed === 'number'
    )
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
  strobe: {
    mode: 'strobe',
    colour: '#ffffff',
    speed: 5,
  },
}
