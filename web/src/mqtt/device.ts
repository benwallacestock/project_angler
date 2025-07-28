import type { LightingPayload, StatusPayload } from '@/mqtt/messageTypes.ts'

export const deviceName = ['Ben', 'Roo'] as const
export type DeviceName = (typeof deviceName)[number]

export type DeviceState = {
  lighting: LightingPayload
  status: StatusPayload
  selected: boolean
}

export type DeviceStateByName = Record<DeviceName, DeviceState>

export const getSelectedDevices = (deviceStateByName: DeviceStateByName) =>
  new Set<DeviceName>(
    Object.entries(deviceStateByName)
      .filter(([_, state]) => state.selected)
      .map(([name]) => name as DeviceName),
  )
