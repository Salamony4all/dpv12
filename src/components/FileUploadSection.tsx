'use client';

import React, { useRef, useState } from 'react';

interface FileUploadSectionProps {
  onUpload: (file: File, scale: number) => Promise<void>;
  isLoading: boolean;
}

export default function FileUploadSection({ onUpload, isLoading }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [calibrationScale, setCalibrationScale] = useState(0.02);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onUpload(file, calibrationScale);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 uppercase tracking-wider">
          PDF to DXF Converter
        </label>
        <p className="text-xs text-zinc-400">
          Upload a vector PDF to extract CAD coordinates
        </p>
      </div>

      {/* Calibration Scale Input */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-400">
          Calibration Scale (m per point)
        </label>
        <input
          type="number"
          value={calibrationScale}
          onChange={(e) => setCalibrationScale(parseFloat(e.target.value))}
          step="0.01"
          min="0.001"
          max="1"
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-zinc-500">
          Default: 0.02 (50 points per meter)
        </p>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm font-medium rounded transition-colors"
      >
        {isLoading ? '⏳ Converting...' : '📤 Upload PDF'}
      </button>

      <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-400 space-y-1">
        <p>💡 How it works:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Uploads to secure server for extraction</li>
          <li>Maps coordinates to Pascal 3D Space</li>
          <li>Builds structural BIM model in real-time</li>
        </ol>
      </div>
    </div>
  );
}
