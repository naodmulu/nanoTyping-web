'use client';
import React from 'react';



const Navigation = ({ id }: { id: string }) => {
  return (
    <header id={id} className="bg-gray-900 border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-yellow-400 font-mono">
              nanoTyping
            </h1>
            <span className="text-xs text-gray-500">beta</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a
              href="#"
              className="hover:text-yellow-400 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              about
            </a>
            <a
              href="#"
              className="hover:text-yellow-400 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              settings
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
