'use client';

import React from 'react';

export default function WorkspaceSidebar() {
  return (
    <aside className="w-80 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex flex-col">
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-xl font-semibold text-zinc-100">Workspace</h1>
        <p className="text-sm text-zinc-400 mt-1">Pascal 3D Viewport</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Navigation</h2>
          <div className="text-xs text-zinc-400 space-y-1">
            <p>🖱️ <span className="font-mono">Drag</span> - Orbit view</p>
            <p>🖱️ <span className="font-mono">Middle + Drag</span> - Pan</p>
            <p>🖱️ <span className="font-mono">Scroll</span> - Zoom</p>
            <p>🎯 <span className="font-mono">Click</span> - Select element</p>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 pt-4">
          <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Status</h2>
          <div className="text-xs text-zinc-400 mt-2">
            <p className="py-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Canvas initialized
            </p>
            <p className="py-1">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Select mode active
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-zinc-800 p-6">
        <p className="text-xs text-zinc-500 text-center">
          Ready for viewport operations
        </p>
      </div>
    </aside>
  );
}
