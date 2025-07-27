import React from 'react'

interface RainbowControlsProps {
  speed: number
  onChangeSpeed: (speed: number) => void
  disabled?: boolean
}

export const RainbowControls: React.FC<RainbowControlsProps> = ({
  speed,
  onChangeSpeed,
  disabled = false,
}) => {
  // You can tweak min/max step as needed
  const MIN = 1
  const MAX = 10

  return (
    <div className="flex flex-col items-center w-full mt-2">
      <div className="flex items-center mb-2 gap-2">
        <span role="img" aria-label="rainbow" className="text-2xl">
          🌈
        </span>
        <span className="font-medium text-blue-900">Rainbow Speed</span>
      </div>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={1}
        value={speed}
        onChange={(e) => onChangeSpeed(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-blue-500"
        style={{ maxWidth: 200 }}
      />
      <span className="text-xs text-gray-500 mt-1">{speed}</span>
    </div>
  )
}
