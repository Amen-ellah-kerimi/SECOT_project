import { useState, useEffect } from 'react';
import StatusIndicators from './StatusIndicators';
import DataTable from './DataTable';
import Charts from './Charts';
import ControlPanel from './ControlPanel';
import MqttManager from '../services/MqttManager';

const Dashboard = () => {
  const [auditData, setAuditData] = useState({
    interceptedMessages: [],
    testResults: [],
    logs: []
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    // Initialize MQTT connection
    const mqttManager = MqttManager.getInstance();

    mqttManager.connect('ws://localhost:9001', () => {
      setConnectionStatus('connected');

      // Subscribe to topics
      mqttManager.subscribe('secot/audit/intercepted');
      mqttManager.subscribe('secot/audit/results');
      mqttManager.subscribe('secot/audit/logs');

      // Set up message handlers
      mqttManager.onMessage((topic, message) => {
        try {
          const payload = JSON.parse(message.toString());

          if (topic === 'secot/audit/intercepted') {
            setAuditData(prev => ({
              ...prev,
              interceptedMessages: [...prev.interceptedMessages, payload]
            }));
          } else if (topic === 'secot/audit/results') {
            setAuditData(prev => ({
              ...prev,
              testResults: [...prev.testResults, payload]
            }));
          } else if (topic === 'secot/audit/logs') {
            setAuditData(prev => ({
              ...prev,
              logs: [...prev.logs, payload]
            }));
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    });

    return () => {
      // Clean up MQTT connection
      mqttManager.disconnect();
    };
  }, []);

  const handleDeviceSelect = (device: string) => {
    setSelectedDevice(device);
  };

  const handleCommandExecute = (command: string) => {
    if (!selectedDevice) {
      alert('Please select a device first');
      return;
    }

    const mqttManager = MqttManager.getInstance();
    mqttManager.publish('secot/command', JSON.stringify({
      device: selectedDevice,
      action: command
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-500 py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white m-0">SECOT Dashboard</h1>
          <div className={`flex items-center px-4 py-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow p-6 bg-[#0f172a]">
        <div className="container mx-auto">
          {/* Status Overview */}
          <div className="panel panel-info mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">System Status</h2>
              <div className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            <StatusIndicators connectionStatus={connectionStatus} testResults={auditData.testResults} />
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Control Panel */}
            <div className="lg:col-span-1">
              <div className="panel panel-primary sticky top-6">
                <h2 className="text-xl font-semibold mb-4">Control Panel</h2>
                <ControlPanel
                  onDeviceSelect={handleDeviceSelect}
                  onCommandExecute={handleCommandExecute}
                  selectedDevice={selectedDevice}
                />
              </div>
            </div>

            {/* Middle Column - Data Tables */}
            <div className="lg:col-span-2">
              <div className="panel panel-success mb-6">
                <h2 className="text-xl font-semibold">Intercepted Messages</h2>
                <DataTable data={auditData.interceptedMessages} title="" />
              </div>

              <div className="panel panel-warning">
                <h2 className="text-xl font-semibold">Audit Logs</h2>
                <DataTable data={auditData.logs} title="" />
              </div>
            </div>

            {/* Right Column - Visualizations */}
            <div className="lg:col-span-1">
              <div className="panel panel-danger">
                <h2 className="text-xl font-semibold">Visualization</h2>
                <Charts data={auditData.testResults} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1e293b] py-3 px-6 text-center text-gray-400 text-sm">
        <div className="container mx-auto">
          SECOT Dashboard &copy; {new Date().getFullYear()} - Security Evaluation of Connected Objects and Things
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
