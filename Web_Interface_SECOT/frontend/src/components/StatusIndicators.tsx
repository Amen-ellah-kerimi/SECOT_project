import React from 'react';

interface StatusIndicatorsProps {
  connectionStatus: string;
  testResults: any[];
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({ connectionStatus, testResults }) => {
  // Calculate status for different audit steps
  const getStatusForTest = (testType: string) => {
    const latestTest = testResults
      .filter(test => test.type === testType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (!latestTest) return 'idle';
    return latestTest.status;
  };

  const dosStatus = getStatusForTest('dos');
  const mitmStatus = getStatusForTest('mitm');
  const deauthStatus = getStatusForTest('deauth');

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'running':
        return 'info';
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'error';
      default:
        return '';
    }
  };

  return (
    <div className="mb-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-indigo-300 bg-[#1e293b]/80 border-b border-[#334155] w-1/4">Test Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-indigo-300 bg-[#1e293b]/80 border-b border-[#334155] w-1/2">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-indigo-300 bg-[#1e293b]/80 border-b border-[#334155] w-1/4">State</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#334155] hover:bg-[#1e293b]/30 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-gray-300">MQTT Connection</td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="text-sm text-gray-300">{connectionStatus === 'connected' ? 'Active connection' : 'Connection failed'}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${connectionStatus === 'connected' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {connectionStatus}
                </div>
              </td>
            </tr>

            <tr className="border-b border-[#334155] hover:bg-[#1e293b]/30 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-gray-300">DoS Test</td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${dosStatus === 'running' ? 'bg-yellow-400 animate-pulse' : dosStatus === 'success' ? 'bg-green-400' : dosStatus === 'failed' ? 'bg-red-400' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-300">{dosStatus === 'running' ? 'Test in progress' : dosStatus === 'success' ? 'Test completed' : dosStatus === 'failed' ? 'Test failed' : 'Not started'}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${dosStatus === 'running' ? 'bg-yellow-500/20 text-yellow-300' : dosStatus === 'success' ? 'bg-green-500/20 text-green-300' : dosStatus === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}>
                  {dosStatus}
                </div>
              </td>
            </tr>

            <tr className="border-b border-[#334155] hover:bg-[#1e293b]/30 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-gray-300">MITM Test</td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${mitmStatus === 'running' ? 'bg-yellow-400 animate-pulse' : mitmStatus === 'success' ? 'bg-green-400' : mitmStatus === 'failed' ? 'bg-red-400' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-300">{mitmStatus === 'running' ? 'Test in progress' : mitmStatus === 'success' ? 'Test completed' : mitmStatus === 'failed' ? 'Test failed' : 'Not started'}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${mitmStatus === 'running' ? 'bg-yellow-500/20 text-yellow-300' : mitmStatus === 'success' ? 'bg-green-500/20 text-green-300' : mitmStatus === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}>
                  {mitmStatus}
                </div>
              </td>
            </tr>

            <tr className="hover:bg-[#1e293b]/30 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-gray-300">Deauth Test</td>
              <td className="py-3 px-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${deauthStatus === 'running' ? 'bg-yellow-400 animate-pulse' : deauthStatus === 'success' ? 'bg-green-400' : deauthStatus === 'failed' ? 'bg-red-400' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-300">{deauthStatus === 'running' ? 'Test in progress' : deauthStatus === 'success' ? 'Test completed' : deauthStatus === 'failed' ? 'Test failed' : 'Not started'}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${deauthStatus === 'running' ? 'bg-yellow-500/20 text-yellow-300' : deauthStatus === 'success' ? 'bg-green-500/20 text-green-300' : deauthStatus === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}>
                  {deauthStatus}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatusIndicators;
