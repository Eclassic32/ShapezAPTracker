import type { BuildingConfig, WireConfig } from "@/config/buildings";

export type Rotation = 0 | 90 | 180 | 270;

// Building size format: HxW (height x width)
export type BuildingSize = '1x1' | '1x2' | '1x4' | '2x2' | '4x4';

export interface Position {
  x: number;
  y: number;
}

export interface AttachedWire {
  name: string;
  sprite: string;
  offsetX: number;
  offsetY: number;
  rotation: Rotation;
}

export interface Building {
  id: string;
  name: string; // config 'name' (e.g., 'Belt_top')
  type: string;
  position: Position;
  size: BuildingSize;
  rotation: Rotation;
  attachedWires?: AttachedWire[]; // may be empty or omitted
  sprite: string; // path to sprite
  config?: BuildingConfig; // optional reference to building config
}

export interface Wire {
  id: string;
  type: string; 
  position: Position;
  rotation: Rotation;
  connectedToBuildingId?: string; // if attached to building, stores building ID
  sprite: string;
  config?: WireConfig; // optional reference to wire config
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
