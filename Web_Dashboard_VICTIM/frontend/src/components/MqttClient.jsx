import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MqttClient = ({ onMessageReceived }) => {
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connection options
    const options = {
      clientId: `mqtt_client_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    };

    // Connect to MQTT broker
    // Note: In a real application, you would use environment variables for these values
    const mqttClient = mqtt.connect('ws://172.26.0.1:9001', options);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      setConnectionStatus('Connected');

      // Subscribe to topics
      mqttClient.subscribe('sensors/temperature');
      mqttClient.subscribe('sensors/humidity');
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT connection error:', err);
      setError(`Connection error: ${err.message}`);
      setConnectionStatus('Error');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log(`Received message on topic ${topic}:`, payload);

        // Pass the message to the parent component
        onMessageReceived(topic, payload);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });

    mqttClient.on('close', () => {
      console.log('Connection to MQTT broker closed');
      setConnectionStatus('Disconnected');
    });

    // Set client to state
    setClient(mqttClient);

    // Clean up on unmount
    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, [onMessageReceived]);

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md text-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300 z-50">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'Connected' ? 'bg-green-500' : connectionStatus === 'Disconnected' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
        <p className="font-medium dark:text-gray-200">
          MQTT Status:
          <span className={`ml-1 ${
            connectionStatus === 'Connected' ? 'text-green-600 dark:text-green-400' :
            connectionStatus === 'Disconnected' ? 'text-red-600 dark:text-red-400' :
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {connectionStatus}
          </span>
        </p>
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default MqttClient;
