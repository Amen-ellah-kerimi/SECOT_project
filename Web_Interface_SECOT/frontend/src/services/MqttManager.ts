import mqtt, { MqttClient } from 'mqtt';

class MqttManager {
  private static instance: MqttManager;
  private client: MqttClient | null = null;
  private messageHandlers: ((topic: string, message: Buffer) => void)[] = [];

  private constructor() {}

  public static getInstance(): MqttManager {
    if (!MqttManager.instance) {
      MqttManager.instance = new MqttManager();
    }
    return MqttManager.instance;
  }

  public connect(brokerUrl: string, onConnect?: () => void): void {
    if (this.client) {
      console.warn('MQTT client already connected');
      return;
    }

    try {
      this.client = mqtt.connect(brokerUrl);

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        if (onConnect) onConnect();
      });

      this.client.on('message', (topic, message) => {
        this.messageHandlers.forEach(handler => handler(topic, message));
      });

      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
      });
    } catch (error) {
      console.error('Failed to connect to MQTT broker:', error);
    }
  }

  public disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.messageHandlers = [];
    }
  }

  public subscribe(topic: string): void {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Error subscribing to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  }

  public publish(topic: string, message: string): void {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    this.client.publish(topic, message, (err) => {
      if (err) {
        console.error(`Error publishing to ${topic}:`, err);
      } else {
        console.log(`Published to ${topic}: ${message}`);
      }
    });
  }

  public onMessage(handler: (topic: string, message: Buffer) => void): void {
    this.messageHandlers.push(handler);
  }
}

export default MqttManager;
