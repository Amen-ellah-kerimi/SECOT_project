import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsProps {
  data: any[];
}

const Charts: React.FC<ChartsProps> = ({ data }) => {
  const [packetRateData, setPacketRateData] = useState({
    labels: [],
    datasets: []
  });

  const [testResultsData, setTestResultsData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (data.length === 0) return;

    // Process data for packet rate chart
    const packetTests = data.filter(item => item.type === 'dos' && item.packetRate);
    if (packetTests.length > 0) {
      const labels = packetTests.map(item => {
        const date = new Date(item.timestamp);
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      });

      const packetRates = packetTests.map(item => item.packetRate);

      setPacketRateData({
        labels,
        datasets: [
          {
            label: 'Packet Rate (packets/sec)',
            data: packetRates,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          }
        ]
      });
    }

    // Process data for test results chart
    const testTypes = ['dos', 'mitm', 'deauth'];
    const successCounts = testTypes.map(type =>
      data.filter(item => item.type === type && item.status === 'success').length
    );
    const failureCounts = testTypes.map(type =>
      data.filter(item => item.type === type && item.status === 'failed').length
    );

    setTestResultsData({
      labels: ['DoS Test', 'MITM Test', 'Deauth Test'],
      datasets: [
        {
          label: 'Success',
          data: successCounts,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Failure',
          data: failureCounts,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }
      ]
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-[#334155] text-center">
          <svg className="w-6 h-6 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p className="text-sm text-gray-400 mb-1">No data available for visualization</p>
          <p className="text-xs text-gray-500">Charts will appear when test data is available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-[#334155] hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-indigo-300">Packet Rate Over Time</h4>
            <div className="text-xs text-gray-500 bg-indigo-900/20 px-2 py-1 rounded-full border border-indigo-500/20">
              Real-time data
            </div>
          </div>
          {packetRateData.labels.length > 0 ? (
            <div className="p-2 bg-[#0f172a]/80 rounded-lg border border-[#334155]">
              <Line
                data={{
                  ...packetRateData,
                  datasets: packetRateData.datasets.map(dataset => ({
                    ...dataset,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: 'rgb(99, 102, 241)',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                  }))
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  color: 'white',
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: '#e0e0e0',
                        font: {
                          size: 11
                        },
                        boxWidth: 15,
                        padding: 10
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleColor: '#e0e0e0',
                      bodyColor: '#e0e0e0',
                      borderColor: '#334155',
                      borderWidth: 1,
                      padding: 10,
                      cornerRadius: 8,
                      displayColors: false
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                      },
                      ticks: {
                        color: '#94a3b8',
                        font: {
                          size: 10
                        }
                      }
                    },
                    y: {
                      grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                      },
                      ticks: {
                        color: '#94a3b8',
                        font: {
                          size: 10
                        }
                      }
                    }
                  }
                }}
                height={200}
              />
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 bg-[#0f172a]/50 rounded-lg border border-[#334155]">
              <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-sm">No packet rate data available</p>
            </div>
          )}
        </div>

        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-[#334155] hover:border-red-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-red-300">Test Results Summary</h4>
            <div className="text-xs text-gray-500 bg-red-900/20 px-2 py-1 rounded-full border border-red-500/20">
              Success vs. Failure
            </div>
          </div>
          {testResultsData.labels.length > 0 && (testResultsData.datasets[0].data.some(d => d > 0) || testResultsData.datasets[1].data.some(d => d > 0)) ? (
            <div className="p-2 bg-[#0f172a]/80 rounded-lg border border-[#334155]">
              <Bar
                data={{
                  ...testResultsData,
                  datasets: [
                    {
                      ...testResultsData.datasets[0],
                      backgroundColor: 'rgba(16, 185, 129, 0.7)',
                      borderColor: 'rgb(16, 185, 129)',
                      borderWidth: 1,
                      borderRadius: 4,
                      hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)'
                    },
                    {
                      ...testResultsData.datasets[1],
                      backgroundColor: 'rgba(239, 68, 68, 0.7)',
                      borderColor: 'rgb(239, 68, 68)',
                      borderWidth: 1,
                      borderRadius: 4,
                      hoverBackgroundColor: 'rgba(239, 68, 68, 0.9)'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: '#e0e0e0',
                        font: {
                          size: 11
                        },
                        boxWidth: 15,
                        padding: 10
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleColor: '#e0e0e0',
                      bodyColor: '#e0e0e0',
                      borderColor: '#334155',
                      borderWidth: 1,
                      padding: 10,
                      cornerRadius: 8
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                      },
                      ticks: {
                        color: '#94a3b8',
                        font: {
                          size: 10
                        }
                      }
                    },
                    y: {
                      grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                      },
                      ticks: {
                        color: '#94a3b8',
                        font: {
                          size: 10
                        }
                      }
                    }
                  }
                }}
                height={200}
              />
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8 bg-[#0f172a]/50 rounded-lg border border-[#334155]">
              <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-sm">No test results data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;
