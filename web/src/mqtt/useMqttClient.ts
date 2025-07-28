import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import mqtt from 'mqtt'
import type { MqttClient } from 'mqtt'
import type { DeviceName } from '@/mqtt/device.ts'
import type { StatusPayload } from '@/mqtt/messageTypes.ts'
import type { LightingPayload } from '@/mqtt/lightingPayload.ts'
import { isStatusPayload } from '@/mqtt/messageTypes.ts'
import { isLightingPayload } from '@/mqtt/lightingPayload.ts'

const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'
const mqttReconnectPeriodInMilliseconds = 5 * 1000
const mqttRootTopic = 'a7b3c45d-e1f2-4a5b-8c9d-e0f1a2b3c4d5'

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
      // Try lighting/status first
      let match = topic.match(lightingRe)

      if (match) {
        const device = match[1] as DeviceName
        try {
          const payload = JSON.parse(message.toString())
          if (isLightingPayload(payload)) {
            onLightingPayloadRef.current?.(device, payload)
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
        try {
          const payload = JSON.parse(message.toString())
          console.log(payload)
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

  const publishSetLightingPayload = useCallback(
    (deviceName: DeviceName, payload: LightingPayload) => {
      const topic = `${mqttRootTopic}/${deviceName}/lighting/set`
      const message = JSON.stringify(payload)
      publish(topic, message, true)
    },
    [mqttRootTopic, publish],
  )

  return { publishSetLightingPayload }
}
