import React, { useState } from 'react';

interface ControlPanelProps {
  onDeviceSelect: (device: string) => void;
  onCommandExecute: (command: string) => void;
  selectedDevice: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onDeviceSelect,
  onCommandExecute,
  selectedDevice
}) => {
  // Mock list of devices - in a real app, this would come from an API
  const devices = [
    { id: 'esp32-01', name: 'ESP32 Device #1' },
    { id: 'esp32-02', name: 'ESP32 Device #2' },
    { id: 'esp8266-01', name: 'ESP8266 Device #1' }
  ];

  // Available commands
  const commands = [
    { id: 'start_dos', name: 'Start DoS Test', description: 'Begin denial of service testing' },
    { id: 'stop_dos', name: 'Stop DoS Test', description: 'Stop denial of service testing' },
    { id: 'start_mitm', name: 'Start MITM Attack', description: 'Begin man-in-the-middle attack simulation' },
    { id: 'stop_mitm', name: 'Stop MITM Attack', description: 'Stop man-in-the-middle attack simulation' },
    { id: 'trigger_deauth', name: 'Trigger Deauthentication', description: 'Send deauthentication packets' },
    { id: 'scan_network', name: 'Scan Network', description: 'Scan for devices on the network' }
  ];

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="device-select" className="block text-sm font-medium text-gray-300 mb-2">
          Select Target Device
        </label>
        <div className="relative">
          <select
            id="device-select"
            value={selectedDevice}
            onChange={(e) => onDeviceSelect(e.target.value)}
            className="block w-full pl-3 pr-10 py-2.5 text-sm bg-[#1e293b]/50 border border-[#334155] text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg appearance-none"
          >
            <option value="">Select a device...</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      {selectedDevice && (
        <div className="mb-4 p-2 bg-indigo-900/30 border border-indigo-700/50 rounded-lg flex items-center">
          <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></div>
          <p className="text-xs text-indigo-300">
            Connected to: <span className="font-semibold">{selectedDevice}</span>
          </p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-indigo-300">Network Operations</h3>
          <div className="h-px flex-grow ml-3 bg-gradient-to-r from-transparent to-indigo-500/30"></div>
        </div>

        <div className="overflow-x-auto border border-[#334155] rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-indigo-300 bg-[#1e293b]/80 border-b border-[#334155] w-1/2">Command</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-indigo-300 bg-[#1e293b]/80 border-b border-[#334155] w-1/2">Action</th>
              </tr>
            </thead>
            <tbody>
              {commands.filter(cmd => cmd.id.includes('scan')).map((command, index) => (
                <tr key={command.id} className={`border-b border-[#334155] hover:bg-[#1e293b]/30 transition-colors ${index === commands.filter(cmd => cmd.id.includes('scan')).length - 1 ? 'border-b-0' : ''}`}>
                  <td className="py-3 px-3">
                    <h4 className="text-sm font-medium text-gray-200">{command.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{command.description}</p>
                  </td>
                  <td className="py-3 px-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => onCommandExecute(command.id)}
                      disabled={!selectedDevice}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded ${selectedDevice ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      Execute
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-red-300">Attack Simulation</h3>
          <div className="h-px flex-grow ml-3 bg-gradient-to-r from-transparent to-red-500/30"></div>
        </div>

        <div className="overflow-x-auto border border-[#334155] rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-red-300 bg-[#1e293b]/80 border-b border-[#334155] w-1/2">Command</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-red-300 bg-[#1e293b]/80 border-b border-[#334155] w-1/2">Action</th>
              </tr>
            </thead>
            <tbody>
              {commands.filter(cmd => !cmd.id.includes('scan')).map((command, index) => (
                <tr key={command.id} className={`border-b border-[#334155] hover:bg-[#1e293b]/30 transition-colors ${index === commands.filter(cmd => !cmd.id.includes('scan')).length - 1 ? 'border-b-0' : ''}`}>
                  <td className="py-3 px-3">
                    <h4 className="text-sm font-medium text-gray-200">{command.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">{command.description}</p>
                  </td>
                  <td className="py-3 px-3 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => onCommandExecute(command.id)}
                      disabled={!selectedDevice}
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded ${selectedDevice ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      Execute
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!selectedDevice && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div>
              <p className="text-xs font-medium text-yellow-300">
                No device selected. Please select a target device to enable command execution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
