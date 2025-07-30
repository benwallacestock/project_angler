import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'
import type { StatusPayload } from '@/mqtt/statusPayload.ts'
import type { LightingPayload } from '@/mqtt/lightingPayload.ts'
import type { DeviceName } from '@/mqtt/device.ts'
import { deviceName } from '@/mqtt/device.ts'
import { isStatusPayload } from '@/mqtt/statusPayload.ts'
import { isLightingPayload } from '@/mqtt/lightingPayload.ts'

const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'
const mqttReconnectPeriodInMilliseconds = 5 * 1000
const mqttRootTopic = 'a7b3c45d-e1f2-4a5b-8c9d-e0f1a2b3c4d6'
const knownDevices = new Set(deviceName)

type UseMqttClientProps = {
  onLightingPayload?: (device: DeviceName, payload: LightingPayload) => void
  onStatusPayload?: (device: DeviceName, payload: StatusPayload) => void
}

export const useMqttClient = ({
  onLightingPayload,
  onStatusPayload,
}: UseMqttClientProps) => {
  const clientRef = useRef<MqttClient | undefined>(undefined)
  const [clientId] = useState<string>(uuid)
  const onLightingPayloadRef =
    useRef<typeof onLightingPayload>(onLightingPayload)
  const onStatusPayloadRef = useRef<typeof onStatusPayload>(onStatusPayload)
  useEffect(() => {
    onLightingPayloadRef.current = onLightingPayload
  }, [onLightingPayload])
  useEffect(() => {
    onStatusPayloadRef.current = onStatusPayload
  }, [onStatusPayload])

  const debouncedLightingCallback = useDebouncedLightingCallback(
    onLightingPayload,
    500,
  )

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = mqtt.connect(brokerUrl, {
        clientId: clientId,
        reconnectPeriod: mqttReconnectPeriodInMilliseconds,
        transformWsUrl: (url, _, client) => {
          client.options.clientId = clientId
          return url
        },
      })
    }
    // --- Handler recognises lighting and status topics ---
    const lightingRe = new RegExp(`^${mqttRootTopic}/([^/]+)/lighting/status$`)
    const statusRe = new RegExp(`^${mqttRootTopic}/([^/]+)/status$`)
    const handler = (topic: string, message: Buffer) => {
      console.log(topic, message.toString())
      // Try lighting/status first
      let match = topic.match(lightingRe)
      if (match) {
        const device = match[1] as DeviceName
        if (!knownDevices.has(device)) {
          return
        }
        try {
          const payload = JSON.parse(message.toString())
          if (isLightingPayload(payload)) {
            debouncedLightingCallback(device, payload)
          }
        } catch (err) {
          return
        }
        return
      }
      // Try generic status (status payload)
      match = topic.match(statusRe)
      if (match) {
        const device = match[1] as DeviceName
        console.log(message.toString())
        if (!knownDevices.has(device)) {
          return
        }
        try {
          const payload = JSON.parse(message.toString())
          if (isStatusPayload(payload)) {
            onStatusPayloadRef.current?.(device, payload)
          }
        } catch (err) {}
      }
    }
    clientRef.current.on('message', handler)
    clientRef.current.subscribe(`${mqttRootTopic}/#`)
    return () => {
      clientRef.current?.off('message', handler)
    }
  }, [clientId])

  const publish = useCallback(
    (subscription: string, message: string, retain = false) => {
      clientRef.current?.publish(subscription, message, { qos: 1, retain })
    },
    [],
  )

  // --- Throttled publisher implementation ---
  const publishSetLightingPayload = useThrottledLightingPublisher(
    publish,
    20, // 100ms throttle interval
  )

  return { publishSetLightingPayload }
}

// --- Throttle implementation: sends at most once per interval, always with latest ---
export const useThrottledLightingPublisher = (
  publish: (topic: string, message: string, retain: boolean) => void,
  interval = 100,
) => {
  const lastPublishRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestArgsRef = useRef<{
    n: DeviceName
    p: LightingPayload
  } | null>(null)

  const throttledPublish = useCallback(
    (name: DeviceName, payload: LightingPayload) => {
      latestArgsRef.current = { n: name, p: payload }
      const now = Date.now()

      const invokePublish = () => {
        if (!latestArgsRef.current) return
        const { n, p } = latestArgsRef.current
        const topic = `${mqttRootTopic}/${n}/lighting/set`
        const message = JSON.stringify(p)
        publish(topic, message, false)
        lastPublishRef.current = Date.now()
        latestArgsRef.current = null
      }

      // If enough time has passed since the last publish, send immediately
      if (now - lastPublishRef.current >= interval) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        invokePublish()
      } else {
        // Otherwise, schedule the next send for after the interval
        if (!timeoutRef.current) {
          const timeLeft = interval - (now - lastPublishRef.current)
          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null
            invokePublish()
          }, timeLeft)
        }
      }
    },
    [mqttRootTopic, publish, interval],
  )

  // Clean up on unmount (optional)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return throttledPublish
}

function useDebouncedLightingCallback(
  cb: ((device: DeviceName, payload: LightingPayload) => void) | undefined,
  delay: number,
) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const latestCb = useRef(cb)
  const latestPayloads = useRef<
    Record<string, { device: DeviceName; payload: LightingPayload }>
  >({})
  useEffect(() => {
    latestCb.current = cb
  }, [cb])
  // Debounce per device name
  return useCallback(
    (device: DeviceName, payload: LightingPayload) => {
      const key = device
      latestPayloads.current[key] = { device, payload }
      clearTimeout(timers.current[key])
      timers.current[key] = setTimeout(() => {
        const latest = latestPayloads.current[key]
        latestCb.current?.(latest.device, latest.payload)
      }, delay)
    },
    [delay],
  )
}
