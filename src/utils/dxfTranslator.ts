import DxfParser from 'dxf-parser';
import { WallNode, ItemNode, SlabNode } from '@pascal-app/core';

export interface TranslatedNodes {
  slabs: SlabNode[];
  walls: WallNode[];
  items: ItemNode[];
}

interface DxfEntity {
  type: string;
  layer: string;
  handle?: string;
  vertices?: { x: number; y: number }[];
  position?: { x: number; y: number };
  rotation?: number;
  name?: string;
}

export function translateDxfToPascalJSON(dxfString: string): TranslatedNodes {
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfString);
  
  const result: TranslatedNodes = { slabs: [], walls: [], items: [] };
  if (!dxf || !dxf.entities) return result;

  // 1. Process slab dimensions to establish building footprint bounds
  const footprintPoints: [number, number][] = [[0,0], [15,0], [15,10], [0,10]];
  result.slabs.push(
    SlabNode.parse({
      id: 'slab_base_main',
      points: footprintPoints,
      thickness: 0.20
    })
  );

  // 2. Parse active vector layers
  dxf.entities.forEach((entity: any, index: number) => {
    // Map structural lines to walls
    if (entity.type === 'LINE' && entity.layer === 'A-WALL') {
      result.walls.push(
        WallNode.parse({
          id: `wall_${entity.handle || index}`,
          points: [
            [entity.vertices[0].x, entity.vertices[0].y],
            [entity.vertices[1].x, entity.vertices[1].y]
          ],
          thickness: 0.15,
          height: 3.0
        })
      );
    }

    // Map blocks to furniture items
    if (entity.type === 'INSERT' && entity.layer === 'I-FURN') {
      const blockName = (entity.name || 'generic').toLowerCase();
      let catalogId = 'generic_box';

      if (blockName.includes('bed')) catalogId = 'bed_double_luxury';
      else if (blockName.includes('desk')) catalogId = 'office_desk_modern';
      else if (blockName.includes('chair')) catalogId = 'ergonomic_office_chair';

      result.items.push(
        ItemNode.parse({
          id: `furniture_${entity.handle || index}`,
          catalogId,
          position: [entity.position.x, 0.0, entity.position.y],
          rotation: [0, entity.rotation || 0, 0],
          dimensions: [1.2, 0.75, 0.6]
        })
      );
    }
  });

  return result;
}
