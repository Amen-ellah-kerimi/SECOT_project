import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MqttClient from './components/MqttClient'
import WebSocketClient from './components/WebSocketClient'
import ApiClient from './components/ApiClient'
import SensorPanel from './components/SensorPanel'
import DarkModeToggle from './components/DarkModeToggle'

function App() {
  const [sensorData, setSensorData] = useState({
    temperature: [],
    humidity: [],
  })
  const [currentReadings, setCurrentReadings] = useState({
    temperature: 0,
    humidity: 0,
    timestamp: new Date().toLocaleTimeString(),
  })
  const [useMqtt, setUseMqtt] = useState(false)
  const [useApi, setUseApi] = useState(false)

  // Handle MQTT messages
  const handleMqttMessage = useCallback((topic, payload) => {
    const timestamp = new Date().toLocaleTimeString()

    if (topic === 'sensors/temperature' && payload.value !== undefined) {
      // Update temperature reading
      setCurrentReadings(prev => ({
        ...prev,
        temperature: parseFloat(payload.value).toFixed(1),
        timestamp,
      }))

      // Update temperature history
      setSensorData(prev => ({
        ...prev,
        temperature: [...prev.temperature, { time: timestamp, value: parseFloat(payload.value).toFixed(1) }].slice(-20),
      }))
    } else if (topic === 'sensors/humidity' && payload.value !== undefined) {
      // Update humidity reading
      setCurrentReadings(prev => ({
        ...prev,
        humidity: parseFloat(payload.value).toFixed(1),
        timestamp,
      }))

      // Update humidity history
      setSensorData(prev => ({
        ...prev,
        humidity: [...prev.humidity, { time: timestamp, value: parseFloat(payload.value).toFixed(1) }].slice(-20),
      }))
    }
  }, [])

  // Handle API data
  const handleApiData = useCallback((data) => {
    if (data.temperature && data.temperature.length > 0) {
      // Update temperature reading with the latest value
      const latestTemp = data.temperature[0];
      setCurrentReadings(prev => ({
        ...prev,
        temperature: latestTemp.value,
        timestamp: latestTemp.time,
      }));

      // Update temperature history
      setSensorData(prev => ({
        ...prev,
        temperature: data.temperature,
      }));
    }

    if (data.humidity && data.humidity.length > 0) {
      // Update humidity reading with the latest value
      const latestHumidity = data.humidity[0];
      setCurrentReadings(prev => ({
        ...prev,
        humidity: latestHumidity.value,
        timestamp: latestHumidity.time,
      }));

      // Update humidity history
      setSensorData(prev => ({
        ...prev,
        humidity: data.humidity,
      }));
    }
  }, [])

  // Simulate sensor data when not using MQTT or API
  useEffect(() => {
    if (useMqtt || useApi) return

    const interval = setInterval(() => {
      // Simulate new sensor readings
      const newTemp = 20 + Math.random() * 10
      const newHumidity = 30 + Math.random() * 40
      const timestamp = new Date().toLocaleTimeString()

      // Update current readings
      setCurrentReadings({
        temperature: newTemp.toFixed(1),
        humidity: newHumidity.toFixed(1),
        timestamp,
      })

      // Update historical data (keep last 20 readings)
      setSensorData(prev => {
        const newTempData = [...prev.temperature, { time: timestamp, value: newTemp.toFixed(1) }].slice(-20)
        const newHumidityData = [...prev.humidity, { time: timestamp, value: newHumidity.toFixed(1) }].slice(-20)

        return {
          temperature: newTempData,
          humidity: newHumidityData,
        }
      })
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [useMqtt, useApi])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <header className="bg-primary-600 dark:bg-primary-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">IoT Sensor Dashboard</h1>
              <p className="text-sm opacity-80">Real-time monitoring of IoT sensor data</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setUseMqtt(true);
                  setUseApi(false);
                }}
                className={`px-4 py-2 rounded-l-md text-sm font-medium transition-colors duration-200 ${useMqtt ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' : 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-800'}`}
                disabled={useMqtt}
              >
                MQTT
              </button>
              <button
                onClick={() => {
                  setUseApi(true);
                  setUseMqtt(false);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${useApi ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' : 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-800'}`}
                disabled={useApi}
              >
                Database
              </button>
              <button
                onClick={() => {
                  setUseMqtt(false);
                  setUseApi(false);
                }}
                className={`px-4 py-2 rounded-r-md text-sm font-medium transition-colors duration-200 ${!useMqtt && !useApi ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' : 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-800'}`}
                disabled={!useMqtt && !useApi}
              >
                Simulation
              </button>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Current Readings Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card dark:shadow-card-dark p-6 mb-6 transition-colors duration-300">
          <h2 className="text-xl font-semibold mb-4 text-primary-700 dark:text-primary-300 border-b pb-2 border-gray-200 dark:border-gray-700">Current Readings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SensorPanel
              title="Temperature"
              value={currentReadings.temperature}
              unit="°C"
              color="blue"
            />
            <SensorPanel
              title="Humidity"
              value={currentReadings.humidity}
              unit="%"
              color="green"
            />
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-300">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Last Update</h3>
              <p className="text-xl font-medium text-gray-600 dark:text-gray-300">{currentReadings.timestamp}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card dark:shadow-card-dark p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold mb-4 text-primary-700 dark:text-primary-300 border-b pb-2 border-gray-200 dark:border-gray-700">Temperature History</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData.temperature}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#6B7280" />
                  <YAxis domain={['auto', 'auto']} stroke="#6B7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: '#3b82f6' }}
                    activeDot={{ stroke: '#3b82f6', strokeWidth: 2, r: 6, fill: '#3b82f6' }}
                    name="Temperature (°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Humidity Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card dark:shadow-card-dark p-6 transition-colors duration-300">
            <h2 className="text-xl font-semibold mb-4 text-primary-700 dark:text-primary-300 border-b pb-2 border-gray-200 dark:border-gray-700">Humidity History</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData.humidity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#6B7280" />
                  <YAxis domain={[0, 100]} stroke="#6B7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#10b981' }}
                    activeDot={{ stroke: '#10b981', strokeWidth: 2, r: 6, fill: '#10b981' }}
                    name="Humidity (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 dark:bg-gray-950 text-white p-4 mt-8 transition-colors duration-300">
        <div className="container mx-auto text-center">
          <p>IoT Sensor Dashboard - {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* MQTT Client */}
      {useMqtt && <MqttClient onMessageReceived={handleMqttMessage} />}

      {/* API Client */}
      {useApi && <ApiClient onDataReceived={handleApiData} />}

      {/* WebSocket Client - Always active for backend connection */}
      <WebSocketClient onMessageReceived={handleMqttMessage} />
    </div>
  );
}

export default App
