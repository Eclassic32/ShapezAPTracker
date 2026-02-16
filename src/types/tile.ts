export type Rotation = 0 | 90 | 180 | 270;

// Building size format: HxW (height x width)
// Example: '1x2' = 1 tile high, 2 tiles wide
export type BuildingSize = '1x1' | '1x2' | '1x4' | '2x2' | '4x4';

export interface Position {
  x: number;
  y: number;
}

export interface Building {
  id: string;
  type: string;
  position: Position;
  size: BuildingSize;
  rotation: Rotation;
  wireAttached?: boolean;
  sprite: string; // path to sprite
}

export interface Wire {
  id: string;
  position: Position;
  rotation: Rotation;
  connectedToBuildingId?: string; // if attached to building, stores building ID
  sprite: string;
}

export interface Entity {
  id: string;
  type: string;
  position: Position;
  sprite: string;
  data?: any; // additional entity data
}

export interface TileMap {
  buildings: Map<string, Building>;
  entities: Map<string, Entity>;
  wires: Map<string, Wire>;
}

export interface GridConfig {
  tileSize: number;
  width: number; // grid width in tiles
  height: number; // grid height in tiles
  offsetX?: number; // camera offset X in pixels
  offsetY?: number; // camera offset Y in pixels
}
