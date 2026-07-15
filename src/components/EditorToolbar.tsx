'use client';

import React from 'react';
import { useScene } from '@pascal-app/core';

/**
 * Simplified light-theme toolbar. Authoring tools are intentionally hidden:
 * the user only navigates, selects, and cleans the imported model
 * (rotate / delete the selected node).
 *
 * Selection/mutation store keys are accessed defensively because the
 * @pascal-app/core store surface beyond createNode/nodes is not documented.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedId(state: any): string | undefined {
  return (
    state.selectedNodeId ??
    state.selectedId ??
    (Array.isArray(state.selection) ? state.selection[0] : undefined)
  );
}

export default function EditorToolbar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedId = useScene((state: any) => getSelectedId(state));

  const rotateSelected = () => {
    if (!selectedId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene: any = useScene.getState();
    const node = Array.isArray(scene.nodes)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scene.nodes.find((n: any) => n?.id === selectedId)
      : scene.nodes?.[selectedId];
    const rotation: [number, number, number] = node?.rotation ?? [0, 0, 0];
    const next = [rotation[0], rotation[1] + Math.PI / 2, rotation[2]];
    (scene.updateNode ?? scene.setNodeProps)?.(selectedId, { rotation: next });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene: any = useScene.getState();
    (scene.deleteNode ?? scene.removeNode ?? scene.destroyNode)?.(selectedId);
  };

  const buttonBase =
    'flex h-10 w-10 items-center justify-center rounded-xl text-base transition-colors disabled:opacity-30';

  return (
    <div className="absolute left-4 top-4 z-20 flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white/90 p-1.5 shadow-lg backdrop-blur">
      <button
        type="button"
        title="Select & navigate — drag to orbit, scroll to zoom, click to select"
        className={`${buttonBase} bg-blue-50 text-blue-600`}
      >
        ⌖
      </button>
      <div className="mx-2 h-px bg-zinc-200" />
      <button
        type="button"
        onClick={rotateSelected}
        disabled={!selectedId}
        title="Rotate selection 90°"
        className={`${buttonBase} text-zinc-600 hover:bg-zinc-100`}
      >
        ⟳
      </button>
      <button
        type="button"
        onClick={deleteSelected}
        disabled={!selectedId}
        title="Delete selection"
        className={`${buttonBase} text-red-500 hover:bg-red-50`}
      >
        🗑
      </button>
    </div>
  );
}
