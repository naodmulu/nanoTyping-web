'use client';
import React from 'react';

const Footer = ({ id }: { id: string }) => {
  return (
    <footer id={id} className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-6">
            <span>nanoTyping © 2024</span>
            <span className="hidden md:inline">•</span>
            <a
              href="#"
              className="hover:text-yellow-400 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              GitHub
            </a>
            <span className="hidden md:inline">•</span>
            <a
              href="#"
              className="hover:text-yellow-400 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              Issues
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">
              Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Tab</kbd> to restart
            </span>
            <span className="hidden md:inline text-gray-700">•</span>
            <span className="text-xs text-gray-600">
              Press <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Esc</kbd> to pause
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
