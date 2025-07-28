import { ShadeSlider, Wheel, hexToHsva, hsvaToHex } from '@uiw/react-color'
import type { ColorResult } from '@uiw/color-convert'
import {
  CustomColourWheelPointer,
  CustomShadeSliderPointer,
} from '@/components/ColourPointers.tsx'

type ColourControlsProps = {
  colour: string
  onColourChange: (colour: string) => void
}

export const ColourControls = ({
  colour,
  onColourChange,
}: ColourControlsProps) => {
  const handleWheelChange = (c: ColorResult) => {
    const newColour = c.hex
    onColourChange(newColour)
  }

  const handleShadeChange = (newShade: { v: number }) => {
    const hsva = hexToHsva(colour)

    onColourChange(
      hsvaToHex({
        ...hsva,
        v: newShade.v,
      }),
    )
  }

  return (
    <>
      <Wheel
        color={colour}
        onChange={handleWheelChange}
        width={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
        height={window.innerWidth < 400 ? window.innerWidth - 40 : 320}
        pointer={CustomColourWheelPointer}
        style={{
          touchAction: 'none',
        }}
      />
      <div className="w-full mt-8 px-2">
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
    </>
  )
}
