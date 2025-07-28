import type { LightingMode } from '@/mqtt/lightingPayload.ts'

type LightingModeSelectProps = {
  lightingMode: LightingMode
  onLightingModeChange: (newLightingMode: LightingMode) => void
}

export const LightingModeSelect = ({
  lightingMode,
  onLightingModeChange,
}: LightingModeSelectProps) => {
  return (
    <div className="flex justify-center mt-6 mb-4">
      <label htmlFor="mode-selector" className="mr-2 font-medium text-gray-700">
        Mode:
      </label>
      <select
        id="mode-selector"
        className="border rounded px-2 py-1 text-sm bg-white"
        value={lightingMode}
        onChange={(e) => {
          const newMode = e.target.value as LightingMode
          onLightingModeChange(newMode)
        }}
      >
        <option value="colour">Colour</option>
        <option value="rainbow">Rainbow</option>
        <option value="strobe">Strobe</option>
      </select>
    </div>
  )
}
