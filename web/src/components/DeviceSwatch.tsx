import { twMerge } from 'tailwind-merge'
import type { DeviceName, DeviceState } from '@/App.tsx'

interface DeviceSwatchProps {
  name: DeviceName
  state: DeviceState
  onClick: () => void
}

function getSwatchStyle(lighting: DeviceState['lighting']) {
  if (lighting.mode === 'colour') {
    return {
      background: lighting.colour,
      displayString: lighting.colour,
    }
  } else if (lighting.mode === 'rainbow') {
    const grad =
      'linear-gradient(90deg, red, orange, yellow, lime, cyan, blue, violet)'
    return {
      background: grad,
      displayString: `🌈 Speed: ${lighting.speed}`,
    }
  }
  return {
    background: '#ccc',
    displayString: '',
  }
}

export const DeviceSwatch = ({ name, state, onClick }: DeviceSwatchProps) => {
  const { lighting, selected } = state
  const swatch = getSwatchStyle(lighting)

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      aria-pressed={selected}
      className={twMerge(
        'flex flex-col items-center justify-end cursor-pointer transition-all rounded-xl bg-white bg-opacity-60 duration-100 active:scale-90 focus:outline-none w-20 py-2 border-[2.5px] border-solid',
        selected
          ? 'scale-105 shadow-lg border-blue-500 ring-2 ring-blue-300'
          : 'shadow-sm border-gray-400',
      )}
    >
      <div
        className="w-10 h-10 rounded-lg border mb-1 transition-all"
        style={{
          background: swatch.background,
          borderColor: selected ? '#3b82f6' : undefined, // blue-500 for selected
        }}
      />
      <span
        className={twMerge(
          'transition-all font-medium text-[15px] tracking-tight pb-[2px] border-b-[3px] leading-[1.2]',
          selected
            ? 'text-blue-900 font-bold border-b-blue-500'
            : 'text-gray-800 font-normal border-b-transparent',
        )}
      >
        {name}
      </span>
      <span className="text-xs text-gray-400 mt-0.5">
        {swatch.displayString}
      </span>
    </button>
  )
}
