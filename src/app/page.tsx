'use client';
import React, { useState } from 'react';
import { useScene } from '@pascal-app/core';
import { Viewer, useViewer } from '@pascal-app/viewer';
import Image from 'next/image';
import WorkspaceSidebar from '@/components/WorkspaceSidebar';
import FileUploadSection from '@/components/FileUploadSection';
import { useBimPipeline } from '@/hooks/useBimPipeline';
import { useRenderIterations } from '@/hooks/useRenderIterations';
import { translateDxfToPascalJSON } from '@/utils/dxfTranslator';



export default function Home() {
  const [prompt, setPrompt] = useState(
    'Modern Japandi style, warm oak wood, soft linen textures, cinematic natural lighting'
  );
  const [isRendering, setIsRendering] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // const { createNode, clearScene } = useScene(); // Unused
  const sceneNodes = useScene((state) => state.nodes);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const takeSnapshot = useViewer((state: any) => state.takeSnapshot);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const captureViewport = useViewer((state: any) => state.captureViewport);
  const { executeStaggeredBuild } = useBimPipeline();
  const { lastImage, setLastImage, runIterationPass } = useRenderIterations();

  const handlePdfUpload = async (file: File, scale: number) => {
    setIsConverting(true);
    try {
      setLogs(prev => [...prev, "📄 PDF Uploaded. Sending to server for extraction..."]);
      
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/pdf-to-dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, calibrationScale: scale })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setLogs(prev => [...prev, "📐 DXF parsed. Translating to Pascal Schema..."]);
      const translated = translateDxfToPascalJSON(data.dxfString);
      
      setLogs(prev => [...prev, "🏗️ Starting BIM Build..."]);
      await executeStaggeredBuild(translated, (msg) => {
        setLogs(prev => [...prev, msg]);
      });
      
      setLogs(prev => [...prev, "✅ Model complete. Ready for rendering."]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLogs(prev => [...prev, `❌ Error: ${message}`]);
    } finally {
      setIsConverting(false);
    }
  };

  const handleRender = async () => {
    setIsRendering(true);
    try {
      const snapshot = await (takeSnapshot || captureViewport)?.();
      const nodes = sceneNodes;

      const res = await fetch('/api/render', {
        method: 'POST',
        body: JSON.stringify({
          viewportSnapshot: snapshot,
          stylePrompt: prompt,
          sceneNodes: nodes
        })
      });
      const data = await res.json();
      if (data.success) {
        setLastImage(data.renderUrl);
      }
    } catch (err) {
      console.error("Render failed", err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleIterate = async () => {
    if (!prompt) return;
    setIsRendering(true);
    try {
      await runIterationPass(prompt);
    } catch (err) {
      console.error("Iteration failed", err);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden p-4 gap-4">
      <WorkspaceSidebar />
      
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 bg-zinc-900 rounded-2xl overflow-hidden relative border border-zinc-800">
          <Viewer />
        </div>

        <div className="h-64 bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex gap-4">
          <div className="flex-1 overflow-y-auto text-xs font-mono text-zinc-500 space-y-1">
            {logs.map((log, i) => <div key={i}>{`> ${log}`}</div>)}
          </div>
          
          <div className="w-80 flex flex-col gap-2">
            <input 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs outline-none focus:ring-1 ring-blue-500"
              placeholder="Describe style or refinements..."
            />
            <div className="flex gap-2">
              <button 
                onClick={handleRender}
                disabled={isRendering}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white text-xs font-bold py-2 rounded-lg transition-all"
              >
                {isRendering ? "Rendering..." : "Generate Render"}
              </button>
              <button 
                onClick={handleIterate}
                disabled={isRendering || !lastImage}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white text-xs font-bold py-2 rounded-lg transition-all"
              >
                Iterate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-96 flex flex-col gap-4">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
          <FileUploadSection 
            onUpload={handlePdfUpload} 
            isLoading={isConverting} 
          />
        </div>
        {lastImage && (
          <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col">
            <div className="p-3 text-xs font-bold border-b border-zinc-800">Final Render</div>
            <Image src={lastImage} fill style={{ objectFit: 'cover' }} alt="Pascal Render" />
          </div>
        )}
      </div>
    </main>
  );
}
