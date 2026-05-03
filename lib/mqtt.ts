import mqtt from "mqtt";

export async function publishMqtt(topic: string, payload: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const clientId = `nala-server-${Math.random().toString(16).slice(2, 10)}`;
    const client = mqtt.connect("mqtt://broker.hivemq.com:1883", {
      clientId,
      clean: true,
      connectTimeout: 8000,
    });

    const timeout = setTimeout(() => {
      client.end(true);
      reject(new Error("MQTT publish timeout"));
    }, 10000);

    client.on("connect", () => {
      client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        clearTimeout(timeout);
        client.end();
        if (err) reject(err);
        else resolve();
      });
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      client.end(true);
      reject(err);
    });
  });
}
