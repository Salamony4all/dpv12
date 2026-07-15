'use client';

import React, { useEffect, useRef, useState } from 'react';

export type ExportFormat = 'glb' | 'stl' | 'obj';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  imageUrl?: string;
}

interface ChatDockProps {
  messages: ChatMessage[];
  busy: boolean;
  hasModel: boolean;
  hasRender: boolean;
  calibrationScale: number;
  onScaleChange: (value: number) => void;
  onAttachPdf: (file: File) => void;
  onSend: (text: string) => void;
  onRender: () => void;
  onExport: (format: ExportFormat) => void;
}

function ActionChip({
  label,
  onClick,
  disabled,
  highlight,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        highlight
          ? 'bg-blue-600 text-white hover:bg-blue-500'
          : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
      }`}
    >
      {label}
    </button>
  );
}

export default function ChatDock({
  messages,
  busy,
  hasModel,
  hasRender,
  calibrationScale,
  onScaleChange,
  onAttachPdf,
  onSend,
  onRender,
  onExport,
}: ChatDockProps) {
  const [draft, setDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="absolute bottom-6 left-1/2 z-20 flex w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur">
      {/* Conversation */}
      <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-400">
            Attach a floor-plan PDF to build the 3D model, then chat to render and
            refine it with Nano Banana.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
              {m.imageUrl && (
                // next/image does not support base64 data URLs
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imageUrl}
                  alt="Nano Banana render"
                  className="mt-1 w-full rounded-xl"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action blocks */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 px-3 py-2">
        <ActionChip
          label="✨ Render"
          onClick={onRender}
          disabled={busy || !hasModel}
          highlight
        />
        <ActionChip label="GLB" onClick={() => onExport('glb')} disabled={busy || !hasModel} />
        <ActionChip label="STL" onClick={() => onExport('stl')} disabled={busy || !hasModel} />
        <ActionChip label="OBJ" onClick={() => onExport('obj')} disabled={busy || !hasModel} />
        <label className="ml-auto flex items-center gap-1 text-[11px] text-zinc-400">
          scale
          <input
            type="number"
            value={calibrationScale}
            step="0.01"
            min="0.001"
            max="1"
            onChange={(e) => onScaleChange(parseFloat(e.target.value) || 0.02)}
            className="w-14 rounded-md border border-zinc-200 bg-white px-1 py-0.5 text-[11px] text-zinc-600 focus:border-blue-400 focus:outline-none"
          />
          m/pt
        </label>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAttachPdf(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          title="Attach floor-plan PDF"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-40"
        >
          📎
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={
            hasRender
              ? 'Refine the render (Nano Banana iteration)…'
              : 'Describe the render style…'
          }
          className="h-9 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700 placeholder-zinc-400 focus:border-blue-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !draft.trim()}
          title="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:bg-zinc-200"
        >
          {busy ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}
