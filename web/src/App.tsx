import { useState } from 'react'
import { produce } from 'immer'
import { ShadeSlider, Wheel, hexToHsva, hsvaToHex } from '@uiw/react-color'
import type { ColorResult } from '@uiw/color-convert'
import { DeviceSwatch } from '@/components/DeviceSwatch.tsx'
import {
  CustomColourWheelPointer,
  CustomShadeSliderPointer,
} from '@/components/ColourPointers.tsx'

const deviceName = ['Ben', 'Roo'] as const
export type DeviceName = (typeof deviceName)[number]

export type DeviceState = {
  mode: string
  colour: string
  battery: number
  online: boolean
  selected: boolean
}

export const App = () => {
  const [deviceState, setDeviceState] = useState<
    Record<DeviceName, DeviceState>
  >({
    Ben: {
      mode: 'colour',
      colour: '#0000ff',
      battery: 69,
      online: true,
      selected: false,
    },
    Roo: {
      mode: 'colour',
      colour: '#ff0000',
      battery: 69,
      online: true,
      selected: false,
    },
  })

  const toggleDeviceSelected = (name: DeviceName) => {
    setDeviceState((prev) =>
      produce(prev, (draft) => {
        draft[name].selected = !draft[name].selected
      }),
    )
  }

  // Get all selected device names as a Set
  const selected = new Set<DeviceName>(
    Object.entries(deviceState)
      .filter(([_, state]) => state.selected)
      .map(([name]) => name as DeviceName),
  )

  // -- Picker Colour Logic --
  // Pick colour to show: If just 1 selected, use that. If 2 selected and they're different, just use Ben's.
  let pickerColour = '#888888'
  if (selected.size === 1) {
    pickerColour = deviceState[[...selected][0]].colour
  } else if (selected.size === 2) {
    const first = deviceState[[...selected][0]].colour
    const second = deviceState[[...selected][1]].colour
    pickerColour = first !== second ? first : first
  }

  // Disable picker if nobody is selected
  const pickerDisabled = selected.size === 0

  // Update all selected device colours
  const handleWheelChange = (c: ColorResult) => {
    const newColour = c.hex
    setDeviceState((prev) =>
      produce(prev, (draft) => {
        for (const name of selected) {
          draft[name].colour = newColour
        }
      }),
    )
  }

  const handleShadeChange = (newShade: { v: number }) => {
    setDeviceState((prev) =>
      produce(prev, (draft) => {
        const hsva = hexToHsva(pickerColour)
        for (const name of selected) {
          draft[name].colour = hsvaToHex({
            ...hsva,
            v: newShade.v,
          })
        }
      }),
    )
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
        <main className="flex flex-col items-center justify-center flex-1 px-4">
          <div className="w-full flex flex-col items-center max-w-xs mt-2">
            <Wheel
              color={pickerColour}
              onChange={handleWheelChange}
              width={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
              height={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
              pointer={CustomColourWheelPointer}
              style={{
                filter: pickerDisabled
                  ? 'grayscale(1) brightness(1.2)'
                  : 'none',
                opacity: pickerDisabled ? 0.5 : 1,
                pointerEvents: pickerDisabled ? 'none' : 'auto',
                touchAction: 'none',
              }}
            />
            <div className="w-full mt-8 px-2">
              <ShadeSlider
                style={{ flex: '1 1 0%' }}
                id="brightness-slider"
                color={pickerColour}
                hsva={hexToHsva(pickerColour)}
                onChange={handleShadeChange}
                pointer={(props) => (
                  <CustomShadeSliderPointer {...props} color={pickerColour} />
                )}
              />
            </div>
            <div className="text-slate-500 text-sm text-center h-6 mt-8 mb-2">
              {selected.size === 0
                ? 'Select someone above to edit their colour'
                : `Editing: ${
                    [...selected].length === 1
                      ? [...selected][0]
                      : [...selected].slice(0, -1).join(', ') +
                        (selected.size > 1
                          ? ' & ' + [...selected].slice(-1)
                          : '')
                  }`}
            </div>
          </div>
        </main>
        <footer className="py-2 text-xs text-gray-400 text-center select-none">
          &copy; {new Date().getFullYear()} Ben Wallace-Stock
        </footer>
      </div>
    </>
  )
}
