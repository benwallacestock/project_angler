export type StatusPayload = {
  batteryPercentage: number
  batteryVoltage: number
  uptime: number
  wifiSignalStrength: number
  timestamp: number
}

export const isStatusPayload = (data: unknown): data is StatusPayload => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).batteryPercentage === 'number' &&
    typeof (data as any).batteryVoltage === 'number' &&
    typeof (data as any).uptime === 'number' &&
    typeof (data as any).wifiSignalStrength === 'number' &&
    typeof (data as any).timestamp === 'number'
  )
}
