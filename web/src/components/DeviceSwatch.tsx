import { twMerge } from 'tailwind-merge'
import type { DeviceName, DeviceState } from '@/mqtt/device.ts'

interface DeviceSwatchProps {
  name: DeviceName
  state: DeviceState
  onClick: () => void
}

const OFFLINE_THRESHOLD_SEC = 40

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

function isDeviceOnline(status: DeviceState['status']): boolean {
  if (!status || typeof status.timestamp !== 'number') return false
  const now = Math.floor(Date.now() / 1000)
  return now - status.timestamp < OFFLINE_THRESHOLD_SEC
}

export const DeviceSwatch = ({ name, state, onClick }: DeviceSwatchProps) => {
  const { lighting, selected, status } = state
  const swatch = getSwatchStyle(lighting)
  const online = isDeviceOnline(status)

  // If offline, show dashes for all metrics
  const batteryPct =
    online && status && typeof status.batteryPercentage === 'number'
      ? Math.round(status.batteryPercentage)
      : null
  const batteryColour =
    batteryPct === null
      ? 'text-gray-400'
      : batteryPct > 75
        ? 'text-green-500'
        : batteryPct > 40
          ? 'text-yellow-500'
          : batteryPct > 15
            ? 'text-orange-500'
            : 'text-red-500'
  const voltage =
    online && status && typeof status.batteryVoltage === 'number'
      ? status.batteryVoltage.toFixed(2)
      : null
  const mins =
    online && status && typeof status.uptime === 'number'
      ? Math.round(status.uptime / 60)
      : null
  const wifi =
    online && status && typeof status.wifiSignalStrength === 'number'
      ? status.wifiSignalStrength
      : null

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      aria-pressed={selected}
      className={twMerge(
        'relative flex flex-col items-center cursor-pointer transition-all rounded-xl bg-white bg-opacity-60 duration-100 active:scale-95 focus:outline-none w-48 py-3 border-[2px] border-solid',
        selected
          ? 'scale-105 shadow-lg border-blue-500 ring-2 ring-blue-300'
          : 'shadow-sm border-gray-400',
      )}
    >
      {/* Colour/rainbow block */}
      <div
        className="w-12 h-12 rounded-lg border mb-1 transition-all"
        style={{
          background: swatch.background,
          borderColor: selected ? '#3b82f6' : undefined, // blue-500
        }}
      />
      {/* Online/Offline Indicator */}
      <div className="absolute left-4 top-4 flex items-center">
        <span
          className={twMerge(
            'inline-block w-3 h-3 rounded-full ring-2 ring-white',
            online ? 'bg-green-500' : 'bg-red-400',
          )}
          title={online ? 'Online' : 'Offline'}
        />
      </div>
      {/* Name */}
      <span
        className={twMerge(
          'font-bold text-base tracking-tight pb-1 border-b border-slate-200 w-full text-center',
          selected ? 'text-blue-900' : 'text-gray-800',
        )}
      >
        {name}
      </span>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-2 w-[80%] mx-auto">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm" title="Battery">
            🔋
          </span>
          <span className={batteryColour}>
            {batteryPct !== null ? `${batteryPct}%` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm" title="Voltage">
            ⚡
          </span>
          <span>{voltage !== null ? `${voltage} V` : '—'}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm" title="Uptime">
            ⌛
          </span>
          <span>{mins !== null ? `${mins} min` : '—'}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm" title="Signal">
            📶
          </span>
          <span>{wifi !== null ? `${wifi}%` : '—'}</span>
        </div>
      </div>
      {/* Info string (colour/rainbow display) */}
      <span className="text-[10px] text-gray-400 mt-2 truncate w-[90%]">
        {swatch.displayString}
      </span>
    </button>
  )
}
