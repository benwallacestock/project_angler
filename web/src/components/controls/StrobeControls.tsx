import React from 'react'
import { ShadeSlider, Wheel, hexToHsva, hsvaToHex } from '@uiw/react-color'
import type { ColorResult } from '@uiw/color-convert'
import {
  CustomColourWheelPointer,
  CustomShadeSliderPointer,
} from '@/components/ColourPointers.tsx'

interface StrobeControlsProps {
  colour: string
  speed: number
  onChange: (colour: string, speed: number) => void
}

export const StrobeControls: React.FC<StrobeControlsProps> = ({
  colour,
  speed,
  onChange,
}) => {
  const handleWheelChange = (c: ColorResult) => {
    const newColour = c.hex
    onChange(newColour, speed)
  }

  const handleShadeChange = (newShade: { v: number }) => {
    const hsva = hexToHsva(colour)
    onChange(
      hsvaToHex({
        ...hsva,
        v: newShade.v,
      }),
      speed,
    )
  }

  const MIN = 1
  const MAX = 20

  return (
    <div className="flex flex-col items-center w-full">
      <Wheel
        color={colour}
        onChange={handleWheelChange}
        width={200}
        height={200}
        pointer={CustomColourWheelPointer}
        style={{
          touchAction: 'none',
        }}
      />
      <div className="w-80 mt-8 px-2">
        <ShadeSlider
          style={{ flex: '1 1 0%' }}
          id="brightness-slider"
          color={colour}
          hsva={hexToHsva(colour)}
          onChange={handleShadeChange}
          pointer={(props) => (
            <CustomShadeSliderPointer {...props} color={colour} />
          )}
        />
      </div>
      <div className="flex flex-col items-center w-full mt-6">
        <div className="flex items-center mb-2 gap-2">
          <span
            role="img"
            aria-label="strobe"
            className="text-2xl"
            style={{ filter: 'drop-shadow(0 0 2px #fff)' }}
          >
            ⚡
          </span>
          <span className="font-medium text-blue-900">Strobe Speed</span>
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={1}
          value={speed}
          onChange={(e) => onChange(colour, Number(e.target.value))}
          className="w-full accent-yellow-500"
          style={{ maxWidth: 200 }}
        />
        <span className="text-xs text-gray-500 mt-1">{speed}</span>
      </div>
    </div>
  )
}
