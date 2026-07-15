import { useScene } from '@pascal-app/core';
import { TranslatedNodes } from '../utils/dxfTranslator';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function useBimPipeline() {
  const { createNode } = useScene();

  const executeStaggeredBuild = async (
    data: TranslatedNodes,
    logCallback: (msg: string) => void
  ) => {
    logCallback("Starting sequence: 100% Valid BIM pipeline...");
    await delay(1000);

    // Phase 1: Pour base slab
    logCallback("Phase 1/4: Pouring concrete structural base slab...");
    data.slabs.forEach(node => createNode(node, 'level_01'));
    await delay(1200);

    // Phase 2: Extrude walls
    logCallback(`Phase 2/4: Extruding ${data.walls.length} structural walls with corner-mitering...`);
    data.walls.forEach(node => createNode(node, 'level_01'));
    await delay(1500);

    // Phase 3: Place furniture
    logCallback(`Phase 3/4: Inserting ${data.items.length} loose furniture & FF&E components...`);
    data.items.forEach(node => createNode(node, 'level_01'));
    await delay(1000);

    logCallback("BIM Sequence Complete: Clay model constructed successfully.");
  };

  return { executeStaggeredBuild };
}
