import type { Building, Wire, Entity, TileMap } from '../types/tile';

export interface SavedTileMap {
  name: string;
  timestamp: number;
  buildings: Building[];
  entities: Entity[];
  wires: Wire[];
}

const STORAGE_KEY = 'shapez-tilemaps';

/**
 * Seed default tile maps on first visit.
 *
 * Only runs when the localStorage key does not exist at all (null).
 * An empty array ("[]") means the user deliberately deleted their maps,
 * so we respect that and do nothing.
 */
export async function seedDefaultTileMaps(): Promise<void> {
  if (localStorage.getItem(STORAGE_KEY) !== null) return;

  try {
    const base = import.meta.env.BASE_URL;
    const [allBuildingsRes, factoriesRes] = await Promise.all([
      fetch(`${base}assets/All Buildings Map.json`),
      fetch(`${base}assets/Factories.json`),
    ]);

    const defaults: SavedTileMap[] = [];

    if (allBuildingsRes.ok) {
      defaults.push(await allBuildingsRes.json() as SavedTileMap);
    }
    if (factoriesRes.ok) {
      defaults.push(await factoriesRes.json() as SavedTileMap);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    // If fetching fails, set an empty array so we don't retry every load.
    localStorage.setItem(STORAGE_KEY, '[]');
  }
}

// Get all saved tile maps
export const getAllSavedMaps = (): SavedTileMap[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Save a tile map
export const saveTileMap = (name: string, tileMap: TileMap): void => {
  const saved: SavedTileMap = {
    name,
    timestamp: Date.now(),
    buildings: Array.from(tileMap.buildings.values()),
    entities: Array.from(tileMap.entities.values()),
    wires: Array.from(tileMap.wires.values()),
  };

  const allMaps = getAllSavedMaps();
  const existingIndex = allMaps.findIndex(m => m.name === name);
  
  if (existingIndex >= 0) {
    allMaps[existingIndex] = saved;
  } else {
    allMaps.push(saved);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allMaps));
};

// Load a tile map
export const loadTileMap = (name: string): SavedTileMap | null => {
  const allMaps = getAllSavedMaps();
  return allMaps.find(m => m.name === name) || null;
};

// Delete a tile map
export const deleteTileMap = (name: string): void => {
  const allMaps = getAllSavedMaps();
  const filtered = allMaps.filter(m => m.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Export tile map as JSON file
export const exportTileMap = (name: string, tileMap: TileMap): void => {
  const saved: SavedTileMap = {
    name,
    timestamp: Date.now(),
    buildings: Array.from(tileMap.buildings.values()),
    entities: Array.from(tileMap.entities.values()),
    wires: Array.from(tileMap.wires.values()),
  };

  const dataStr = JSON.stringify(saved, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
};

// Import tile map from file
export const importTileMap = (file: File): Promise<SavedTileMap> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid tile map file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
