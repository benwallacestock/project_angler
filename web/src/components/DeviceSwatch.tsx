import type { DeviceName, DeviceState } from '@/App.tsx'
import { twMerge } from 'tailwind-merge'

interface DeviceSwatchProps {
  name: DeviceName
  state: DeviceState
  onClick: () => void
}

export const DeviceSwatch = ({ name, state, onClick }: DeviceSwatchProps) => {
  const { colour, selected } = state

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      aria-pressed={selected}
      className={twMerge(
        'flex flex-col items-center justify-end cursor-pointer transition-all rounded-xl bg-white bg-opacity-60 duration-100 active:scale-90 focus:outline-none w-20 py-2 border-[2.5px] border-solid border-gray-400',
        selected ? 'scale-105 shadow-lg' : 'shadow-sm',
      )}
      style={{
        boxShadow: selected ? `0 2px 12px 0 ${colour}55` : undefined,
        borderColor: selected ? colour : undefined,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg border mb-1 transition-all"
        style={{
          backgroundColor: colour,
          borderColor: selected ? colour : undefined,
        }}
      />
      <span
        className={twMerge(
          'transition-all font-medium text-[15px] tracking-tight pb-[2px] border-b-[3px] leading-[1.2]',
          selected
            ? 'text-blue-900 font-bold border-b-[3px]'
            : 'text-gray-800 font-normal border-b-transparent',
        )}
        style={{
          borderBottomColor: selected ? colour : undefined,
        }}
      >
        {name}
      </span>
      <span className="text-xs text-gray-400 mt-0.5">{colour}</span>
    </button>
  )
}
