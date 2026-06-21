'use client';
import React from 'react';

const Navigation = () => {
  return (
    <header id="site-header" className="bg-gray-900 border-b border-gray-800 relative">
      <a href="#main-content" className="skip-link">
        Skip to typing test
      </a>
      <nav className="max-w-7xl mx-auto px-4 py-4" aria-label="Main">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-yellow-400 font-mono">
              nanoTyping
            </h1>
            <span className="text-xs text-gray-500">beta</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a
              href="https://github.com/naodmulu/nanoTyping-web/blob/main/DESIGN.md"
              className="hover:text-yellow-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              about
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
