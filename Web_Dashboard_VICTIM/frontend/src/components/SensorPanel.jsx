import React from 'react';

const SensorPanel = ({ title, value, unit, color, icon }) => {
  // Define color classes based on the color prop with dark mode support
  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-300',
          value: 'text-blue-600 dark:text-blue-400',
          icon: 'text-blue-500 dark:text-blue-400'
        };
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-300',
          value: 'text-green-600 dark:text-green-400',
          icon: 'text-green-500 dark:text-green-400'
        };
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-300',
          value: 'text-red-600 dark:text-red-400',
          icon: 'text-red-500 dark:text-red-400'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-300',
          value: 'text-yellow-600 dark:text-yellow-400',
          icon: 'text-yellow-500 dark:text-yellow-400'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-800 dark:text-gray-300',
          value: 'text-gray-600 dark:text-gray-400',
          icon: 'text-gray-500 dark:text-gray-400'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  // Define icons based on the title
  const getIcon = (title) => {
    switch (title.toLowerCase()) {
      case 'temperature':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${colorClasses.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v7.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V3a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'humidity':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${colorClasses.icon}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return icon;
    }
  };

  const displayIcon = icon || getIcon(title);

  return (
    <div className={`${colorClasses.bg} p-4 rounded-lg shadow-sm transition-colors duration-300`}>
      <h3 className={`text-lg font-medium ${colorClasses.text} flex items-center mb-2`}>
        {displayIcon && <span className="mr-2">{displayIcon}</span>}
        {title}
      </h3>
      <p className={`text-3xl font-bold ${colorClasses.value}`}>
        {value}{unit}
      </p>
    </div>
  );
};

export default SensorPanel;
