import React from 'react';

interface DataTableProps {
  data: any[];
  title: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, title }) => {
  if (data.length === 0) {
    return (
      <div className="mb-6">
        {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-[#334155] text-center">
          <svg className="w-6 h-6 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-sm text-gray-400 mb-1">No data available</p>
          <p className="text-xs text-gray-500">Data will appear here when available</p>
        </div>
      </div>
    );
  }

  // Get all unique keys from the data objects
  const allKeys = Array.from(
    new Set(
      data.flatMap(item => Object.keys(item))
    )
  );

  // Filter out some keys that might be too verbose
  const displayKeys = allKeys.filter(key =>
    !['raw', 'binary', 'buffer', 'fullPacket'].includes(key)
  );

  return (
    <div className="mb-6 overflow-x-auto">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <div className="border border-[#334155] rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-[#334155]">
          <thead>
            <tr>
              {displayKeys.map(key => (
                <th
                  key={key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider bg-[#1e293b]/80"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]">
            {data.slice(-10).map((item, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-[#1e293b]/30' : 'bg-[#1e293b]/50'} hover:bg-indigo-900/10 transition-colors`}>
                {displayKeys.map(key => (
                  <td key={`${index}-${key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {typeof item[key] === 'object'
                      ? JSON.stringify(item[key]).substring(0, 50) + (JSON.stringify(item[key]).length > 50 ? '...' : '')
                      : String(item[key] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 10 && (
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-gray-500 bg-[#1e293b]/50 px-3 py-1 rounded-full border border-[#334155]">
            <span className="text-indigo-400 font-medium">{data.length}</span> total entries
          </div>
          <div className="text-xs text-gray-500">
            Showing last <span className="text-indigo-400 font-medium">10</span> entries
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
