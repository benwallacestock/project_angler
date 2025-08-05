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
import { IpBlocker } from '@/components/IpBlocker.tsx'

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
    <IpBlocker>
      <div className="flex flex-col min-h-svh max-h-svh w-full bg-gradient-to-b from-neutral-100 to-blue-100 select-none">
        <header className="pt-6 pb-3 px-2 text-center bg-white bg-opacity-70 backdrop-blur-md shadow-md">
          <div className="relative w-full flex items-center justify-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-blue-900">
              Project Angler
            </h1>
            <a
              href="/blog"
              title="Devlog"
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:fill-blue-900 w-8 h-8"
              tabIndex={0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z" />
              </svg>
            </a>
          </div>
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
    </IpBlocker>
  )
}
