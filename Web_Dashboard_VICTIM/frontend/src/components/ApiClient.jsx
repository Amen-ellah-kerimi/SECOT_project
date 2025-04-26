import { useState, useEffect } from 'react';

const ApiClient = ({ onDataReceived }) => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setConnectionStatus('Connecting');
        
        // Fetch temperature data
        const tempResponse = await fetch('http://localhost:8081/api/sensor/temperature');
        if (!tempResponse.ok) {
          throw new Error(`Temperature API error: ${tempResponse.status}`);
        }
        const tempData = await tempResponse.json();
        
        // Fetch humidity data
        const humidityResponse = await fetch('http://localhost:8081/api/sensor/humidity');
        if (!humidityResponse.ok) {
          throw new Error(`Humidity API error: ${humidityResponse.status}`);
        }
        const humidityData = await humidityResponse.json();
        
        // Process the data
        if (tempData.length > 0 || humidityData.length > 0) {
          setConnectionStatus('Connected');
          
          // Format the data for the charts
          const formattedTempData = tempData.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            value: item.value.toFixed(1)
          }));
          
          const formattedHumidityData = humidityData.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            value: item.value.toFixed(1)
          }));
          
          // Pass the data to the parent component
          onDataReceived({
            temperature: formattedTempData,
            humidity: formattedHumidityData
          });
        } else {
          setConnectionStatus('No Data');
        }
        
        setError(null);
      } catch (err) {
        console.error('API error:', err);
        setError(`Connection error: ${err.message}`);
        setConnectionStatus('Error');
      }
    };

    // Fetch data initially
    fetchData();
    
    // Set up interval to fetch data every 10 seconds
    const interval = setInterval(fetchData, 10000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [onDataReceived]);

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md text-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300 z-50">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          connectionStatus === 'Connected' ? 'bg-green-500' : 
          connectionStatus === 'Disconnected' ? 'bg-red-500' : 
          connectionStatus === 'Connecting' ? 'bg-yellow-500' :
          connectionStatus === 'No Data' ? 'bg-blue-500' :
          'bg-red-500'
        }`}></div>
        <p className="font-medium dark:text-gray-200">
          API Status: 
          <span className={`ml-1 ${
            connectionStatus === 'Connected' ? 'text-green-600 dark:text-green-400' : 
            connectionStatus === 'Disconnected' ? 'text-red-600 dark:text-red-400' : 
            connectionStatus === 'Connecting' ? 'text-yellow-600 dark:text-yellow-400' :
            connectionStatus === 'No Data' ? 'text-blue-600 dark:text-blue-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {connectionStatus}
          </span>
        </p>
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ApiClient;
