// Import MQTT
const mqtt = require('mqtt');

// --- Payload validation (as per your isLightingPayload) ---
function isLightingPayload(data) {
  if (
    typeof data === 'object' &&
    data !== null &&
    'mode' in data &&
    data.mode === 'colour' &&
    typeof data.colour === 'string'
  ) {
    return true;
  }
  if (
    typeof data === 'object' &&
    data !== null &&
    'mode' in data &&
    data.mode === 'rainbow' &&
    typeof data.speed === 'number'
  ) {
    return true;
  }
  return false;
}

// --- Config ---
const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';
const rootTopic = 'a7b3c45d-e1f2-4a5b-8c9d-e0f1a2b3c4d5';

// --- Connect to broker ---
const client = mqtt.connect(brokerUrl, {
  clientId: 'lighting-bounce-' + Math.floor(Math.random() * 100000),
  reconnectPeriod: 5000,
});

client.on('connect', () => {
  console.log('MQTT connected.');
  client.subscribe(`${rootTopic}/+/lighting/set`, (err) => {
    if (err) {
      console.error('Subscribe error:', err);
    } else {
      console.log('Subscribed to all lighting set commands.');
    }
  });
});

client.on('message', (topic, message) => {
  // Match /ROOT/DEVICE/lighting/set
  const match = topic.match(/^(.+)\/([^/]+)\/lighting\/set$/);
  if (!match) return;

  const [, root, device] = match;
  if (root !== rootTopic) return;

  let payload;
  try {
    payload = JSON.parse(message.toString());
  } catch (err) {
    console.error('Could not parse payload', err);
    return;
  }

  if (!isLightingPayload(payload)) {
    console.log('Received invalid lighting payload, ignoring.');
    return;
  }

  // Bounce it to /lighting/status
  const statusTopic = `${rootTopic}/${device}/lighting/status`;
  client.publish(statusTopic, JSON.stringify(payload), { qos: 1, retain: true });
  console.log(`Bounced /lighting/set to /lighting/status for device: ${device}`);
});

client.on('error', (err) => {
  console.error('MQTT error:', err);
});

process.on('SIGINT', () => {
  client.end(false, () => {
    console.log('Disconnected from MQTT. Exiting.');
    process.exit(0);
  });
});