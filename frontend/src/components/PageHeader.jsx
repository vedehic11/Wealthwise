import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  action,
  className = ""
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex items-center space-x-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;