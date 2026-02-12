
import React from 'react';
import { APP_TITLE, ICONS } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            {ICONS.FILE_TEXT}
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {APP_TITLE}
          </h1>
        </div>
        <div className="text-sm font-medium text-gray-500 hidden sm:block">
          Data Transformation Assistant
        </div>
      </div>
    </header>
  );
};

export default Header;
