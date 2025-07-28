import { useState } from 'react'
import { produce } from 'immer'
import type { Draft } from 'immer'
import type { DeviceName, DeviceStateByName } from '@/mqtt/device.ts'
import type { LightingPayload } from '@/mqtt/lightingPayload.ts'
import { deviceName, getSelectedDevices } from '@/mqtt/device.ts'
import { DeviceSwatch } from '@/components/DeviceSwatch.tsx'
import { useMqttClient } from '@/mqtt/useMqttClient.ts'
import { RainbowControls } from '@/components/controls/RainbowControls.tsx'
import { ColourControls } from '@/components/controls/ColourControls.tsx'
import { LightingModeSelect } from '@/components/LightingModeSelect.tsx'
import { defaultLightingPayloadByMode } from '@/mqtt/lightingPayload.ts'
import { StrobeControls } from '@/components/controls/StrobeControls.tsx'

export const App = () => {
  const [deviceState, setDeviceState] = useState<DeviceStateByName>({
    Ben: {
      lighting: defaultLightingPayloadByMode['colour'],
      status: undefined,
      selected: false,
    },
    Roo: {
      lighting: defaultLightingPayloadByMode['colour'],
      status: undefined,
      selected: false,
    },
  })

  const { publishSetLightingPayload } = useMqttClient({
    onLightingPayload: (device, payload) => {
      setDeviceState((prev) =>
        produce(prev, (draft) => {
          draft[device].lighting = payload
        }),
      )
    },
    onStatusPayload: (device, payload) => {
      setDeviceState((prev) =>
        produce(prev, (draft) => {
          draft[device].status = payload
        }),
      )
    },
  })

  const toggleDeviceSelected = (name: DeviceName) => {
    if (firstSelectedDeviceState !== null) {
      updateLightingPayloadForDevices([name], firstSelectedDeviceState.lighting)
    }

    setDeviceState((prev) =>
      produce(prev, (draft: Draft<DeviceStateByName>) => {
        draft[name].selected = !draft[name].selected
      }),
    )
  }

  // Get all selected device names as a Set
  const selectedDevices = getSelectedDevices(deviceState)
  const firstSelectedDeviceState =
    selectedDevices.size < 1 ? null : deviceState[[...selectedDevices][0]]

  const updateLightingPayloadForDevices = (
    deviceNames: Array<DeviceName>,
    lightingPayload: LightingPayload,
  ) => {
    setDeviceState((prev) =>
      produce(prev, (draft) => {
        for (const name of deviceNames) {
          draft[name].lighting = lightingPayload
        }
      }),
    )

    for (const name of deviceNames) {
      publishSetLightingPayload(name, lightingPayload)
    }
  }

  const updateLightingPayloadForSelectedDevices = (
    lightingPayload: LightingPayload,
  ) => updateLightingPayloadForDevices([...selectedDevices], lightingPayload)

  // Pass relevant props down like before, depending on selectedMode.
  function renderLightingControlsForMode() {
    if (firstSelectedDeviceState == null) return null

    switch (firstSelectedDeviceState.lighting.mode) {
      case 'colour': {
        return (
          <ColourControls
            colour={firstSelectedDeviceState.lighting.colour}
            onColourChange={(newColour) =>
              updateLightingPayloadForSelectedDevices({
                mode: 'colour',
                colour: newColour,
              })
            }
          />
        )
      }
      case 'rainbow': {
        return (
          <RainbowControls
            speed={firstSelectedDeviceState.lighting.speed}
            onChangeSpeed={(newSpeed) =>
              updateLightingPayloadForSelectedDevices({
                mode: 'rainbow',
                speed: newSpeed,
              })
            }
          />
        )
      }
      case 'strobe':
        return (
          <StrobeControls
            speed={firstSelectedDeviceState.lighting.speed}
            colour={firstSelectedDeviceState.lighting.colour}
            onChange={(newColour, newSpeed) => {
              updateLightingPayloadForSelectedDevices({
                mode: 'strobe',
                colour: newColour,
                speed: newSpeed,
              })
            }}
          />
        )
      default: {
        return null
      }
    }
  }

  return (
    <>
      <div className="flex flex-col min-h-svh max-h-svh w-full bg-gradient-to-b from-neutral-100 to-blue-100 select-none">
        <header className="pt-6 pb-3 px-2 text-center bg-white bg-opacity-70 backdrop-blur-md shadow-md">
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">
            Project Angler
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-3">
            Tap a person below to edit their colour
          </p>
          <div className="flex justify-center gap-4 w-full mb-2">
            {deviceName.map((name) => (
              <DeviceSwatch
                key={name}
                name={name}
                state={deviceState[name]}
                onClick={() => toggleDeviceSelected(name)}
              />
            ))}
          </div>
        </header>
        <main className="flex flex-col items-center flex-1 px-4">
          {firstSelectedDeviceState !== null && (
            <>
              <LightingModeSelect
                lightingMode={firstSelectedDeviceState.lighting.mode}
                onLightingModeChange={(newMode) =>
                  updateLightingPayloadForSelectedDevices(
                    defaultLightingPayloadByMode[newMode],
                  )
                }
              />

              <div className="w-full flex flex-col items-center justify-center flex-1 max-w-xs mt-2">
                {renderLightingControlsForMode()}
                <div className="text-slate-500 text-sm text-center h-6 mt-8 mb-2">
                  {selectedDevices.size === 0
                    ? 'Select someone above to edit their colour'
                    : `Editing: ${
                        [...selectedDevices].length === 1
                          ? [...selectedDevices][0]
                          : [...selectedDevices].slice(0, -1).join(', ') +
                            (selectedDevices.size > 1
                              ? ' & ' + [...selectedDevices].slice(-1)
                              : '')
                      }`}
                </div>
              </div>
            </>
          )}
        </main>
        <footer className="py-2 text-xs text-gray-400 text-center select-none">
          &copy; {new Date().getFullYear()} Ben Wallace-Stock
        </footer>
      </div>
    </>
  )
}
