import { useState, useEffect, useCallback } from 'react';

const WebSocketClient = ({ onMessageReceived }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);

  // Connect to WebSocket server
  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket('ws://localhost:8081/ws');

    // Connection opened
    ws.addEventListener('open', () => {
      console.log('Connected to WebSocket server');
      setConnectionStatus('Connected');
      setError(null);
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Message from server:', data);

        // Pass the message to the parent component
        if (data.topic && data.payload) {
          onMessageReceived(data.topic, data.payload);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });

    // Connection closed
    ws.addEventListener('close', () => {
      console.log('Disconnected from WebSocket server');
      setConnectionStatus('Disconnected');

      // Try to reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
      }, 5000);
    });

    // Connection error
    ws.addEventListener('error', (err) => {
      console.error('WebSocket error:', err);
      setError('Connection error');
      setConnectionStatus('Error');
    });

    // Save socket to state
    setSocket(ws);

    // Clean up on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [onMessageReceived]);

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md text-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300 z-50">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'Connected' ? 'bg-green-500' : connectionStatus === 'Disconnected' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
        <p className="font-medium dark:text-gray-200">
          WebSocket Status:
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

export default WebSocketClient;
