export type StatusPayload = {
  batteryPercentage: number
  batteryVoltage: number
  uptime: number
  wifiSignalStrength: number
}

export const isStatusPayload = (data: unknown): data is StatusPayload => {
  if (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).batteryPercentage === 'number' &&
    typeof (data as any).batteryVoltage === 'number' &&
    typeof (data as any).uptime === 'number' &&
    typeof (data as any).wifiSignalStrength === 'number'
  ) {
    return true
  }
  return false
}

export type LightingPayload =
  | {
      mode: 'colour'
      colour: string
    }
  | {
      mode: 'rainbow'
      speed: number
    }

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
