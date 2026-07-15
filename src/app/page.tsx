'use client';

import React, { useRef, useState } from 'react';
import { useScene } from '@pascal-app/core';
import { Viewer, useViewer } from '@pascal-app/viewer';
import ChatDock, { ChatMessage, ExportFormat } from '@/components/ChatDock';
import EditorToolbar from '@/components/EditorToolbar';
import { useBimPipeline } from '@/hooks/useBimPipeline';
import { translateDxfToPascalJSON } from '@/utils/dxfTranslator';

const errText = (err: unknown) =>
  err instanceof Error ? err.message : 'Unknown error';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [hasModel, setHasModel] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const [calibrationScale, setCalibrationScale] = useState(0.02);
  const idRef = useRef(0);

  const sceneNodes = useScene((state) => state.nodes);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const takeSnapshot = useViewer((state: any) => state.takeSnapshot);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const captureViewport = useViewer((state: any) => state.captureViewport);
  const { executeStaggeredBuild } = useBimPipeline();

  const push = (role: 'user' | 'assistant', text?: string, imageUrl?: string) => {
    idRef.current += 1;
    const id = `msg_${idRef.current}`;
    setMessages((prev) => [...prev, { id, role, text, imageUrl }]);
  };

  const handleAttachPdf = async (file: File) => {
    setBusy(true);
    push('user', `📎 ${file.name}`);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      push('assistant', 'Extracting vector linework from the PDF…');
      const res = await fetch('/api/pdf-to-dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, calibrationScale }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      push('assistant', 'DXF parsed. Translating to the Pascal node schema…');
      const translated = translateDxfToPascalJSON(data.dxfString);

      await executeStaggeredBuild(translated, (msg) => push('assistant', msg));
      setHasModel(true);
      push(
        'assistant',
        '✅ Model ready. Clean it up with the toolbar (rotate / delete), then render.'
      );
    } catch (err) {
      push('assistant', `❌ ${errText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const requestRender = async (stylePrompt: string, snapshotOverride?: string) => {
    const snapshot =
      snapshotOverride ?? (await (takeSnapshot || captureViewport)?.());
    if (!snapshot) throw new Error('Could not capture the viewport.');

    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        viewportSnapshot: snapshot,
        stylePrompt,
        sceneNodes,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    setLastImage(data.renderUrl);
    push('assistant', undefined, data.renderUrl);
  };

  const handleRender = async () => {
    setBusy(true);
    push('user', '✨ Generate render');
    try {
      push('assistant', 'Sending clay snapshot to Nano Banana…');
      await requestRender(
        'Photorealistic architectural interior, natural lighting'
      );
    } catch (err) {
      push('assistant', `❌ ${errText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (text: string) => {
    setBusy(true);
    push('user', text);
    try {
      if (lastImage) {
        push('assistant', 'Iterating on the last render…');
        await requestRender(
          `Apply these refinements: ${text}. Keep everything else in the layout identical.`,
          lastImage
        );
      } else {
        push('assistant', 'Rendering with your style prompt…');
        await requestRender(text);
      }
    } catch (err) {
      push('assistant', `❌ ${errText(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      // Export surface accessed defensively; documented formats: GLB, STL, OBJ
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scene: any = useScene.getState();
      const exporter = scene.exportScene ?? scene.export ?? scene.exportModel;
      if (!exporter) {
        throw new Error(
          `Export API for .${format} not found in this @pascal-app/core version.`
        );
      }
      const output = await exporter.call(scene, format);
      const blob =
        output instanceof Blob
          ? output
          : new Blob([output], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pascal-model.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
      push('assistant', `⬇️ Exported model as .${format.toUpperCase()}`);
    } catch (err) {
      push('assistant', `❌ ${errText(err)}`);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-800">
      {/* Full-bleed simplified Pascal editor (light theme) */}
      <div className="absolute inset-0">
        <Viewer />
      </div>

      <EditorToolbar />

      <ChatDock
        messages={messages}
        busy={busy}
        hasModel={hasModel}
        hasRender={!!lastImage}
        calibrationScale={calibrationScale}
        onScaleChange={setCalibrationScale}
        onAttachPdf={handleAttachPdf}
        onSend={handleSend}
        onRender={handleRender}
        onExport={handleExport}
      />
    </main>
  );
}
