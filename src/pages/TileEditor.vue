<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import TileRenderer from '../components/TileRenderer.vue';
import type { Building, Wire, Entity, GridConfig, Position, Rotation, BuildingSize } from '../types/tile';
import { saveTileMap, loadTileMap, getAllSavedMaps, deleteTileMap, exportTileMap, importTileMap } from '../utils/storage';
import type { SavedTileMap } from '../utils/storage';
import { buildingConfigs, wireConfigs, entityShapeConfigs, entityColorConfigs } from '../config/buildings';
import { renderShape } from '../utils/shape-generator';

// Grid configuration
const gridConfig = ref<GridConfig>({
  tileSize: 48,
  width: 30,
  height: 20,
  offsetX: 0,
  offsetY: 0,
});

// Tile maps
const buildings = reactive(new Map<string, Building>());
const wires = reactive(new Map<string, Wire>());
const entities = reactive(new Map<string, Entity>());

// Editor state
const selectedTool = ref<'building' | 'wire' | 'entity' | 'erase' | 'none'>('building');
const selectedBuilding = ref<string>('Belt_top');
const selectedBuildingSize = ref<BuildingSize>('1x1');
const selectedWire = ref<string>('Analyzer');
const selectedEntityShape = ref<string>('CuCuCuCu'); // Circle
const selectedRotation = ref<Rotation>(0);
const showGrid = ref(true);
const mapName = ref('Untitled Map');
const savedMaps = ref<SavedTileMap[]>([]);
const showLoadDialog = ref(false);
const importInput = ref<HTMLInputElement | null>(null);

// Custom entity shapes (generated shapes)
const customEntityShapes = reactive<Array<{ name: string; shape: string; sprite: string }>>([
  ...entityShapeConfigs.map(config => ({
    name: config.name,
    shape: config.shape,
    sprite: '', // Will be generated
  }))
]);

// Panning state
const isPanning = ref(false);
const panStart = ref<{ x: number; y: number } | null>(null);

// Keyboard state
const isShiftPressed = ref(false);
const isSpacePressed = ref(false);
const isContinuousPlacing = ref(false);
const toolBeforeSpace = ref<typeof selectedTool.value | null>(null);

// Auto-enable wire layer when Wire tool is selected
const showWireLayer = computed(() => selectedTool.value === 'wire');

// Available buildings and wires from config
const availableBuildings = buildingConfigs;
const availableWires = wireConfigs;

// Generate sprites for entity shapes
for (const shape of customEntityShapes) {
  try {
    shape.sprite = renderShape(shape.shape, 48);
  } catch (error) {
    console.error('Failed to render shape:', shape.shape, error);
  }
}

// Entity generator using selected shape
const generateEntity = (position: Position): Entity => {
  // Check if it's a color entity (from entityColorConfigs)
  const colorEntity = entityColorConfigs.find(c => c.name === selectedEntityShape.value);
  
  if (colorEntity) {
    // It's a pre-made colored entity
    return {
      id: `entity-${Date.now()}-${Math.random()}`,
      type: 'color',
      position,
      sprite: `/src/assets/entities/${colorEntity.sprite}`,
      data: {
        color: colorEntity.name,
      }
    };
  }
  
  // It's a custom shape entity
  return {
    id: `entity-${Date.now()}-${Math.random()}`,
    type: 'shape',
    position,
    sprite: customEntityShapes.find(s => s.shape === selectedEntityShape.value)?.sprite || '',
    data: {
      shape: selectedEntityShape.value,
    }
  };
};

// Get tile position from mouse event
const getTilePosition = (event: MouseEvent): Position => {
  const canvas = event.target as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  
  // Calculate the scale factor between displayed size and actual canvas size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Get mouse position relative to canvas in actual pixels
  const canvasX = (event.clientX - rect.left) * scaleX;
  const canvasY = (event.clientY - rect.top) * scaleY;
  
  // Apply camera offset and convert to tile coordinates
  const offsetX = gridConfig.value.offsetX || 0;
  const offsetY = gridConfig.value.offsetY || 0;
  const x = Math.floor((canvasX + offsetX) / gridConfig.value.tileSize);
  const y = Math.floor((canvasY + offsetY) / gridConfig.value.tileSize);
  
  return { x, y };
};

// Check if tile is occupied by a building
const isTileOccupied = (position: Position, excludeId?: string): boolean => {
  // Check buildings
  for (const building of buildings.values()) {
    if (excludeId && building.id === excludeId) continue;
    
    // Size format is HxW (height x width)
    const [h = 1, w = 1] = building.size.split('x').map(Number);
    const dims = building.rotation === 90 || building.rotation === 270 
      ? { width: h, height: w } 
      : { width: w, height: h };
    
    if (
      position.x >= building.position.x &&
      position.x < building.position.x + dims.width &&
      position.y >= building.position.y &&
      position.y < building.position.y + dims.height
    ) {
      return true;
    }
  }
  return false;
};

// Get building at position
const getBuildingAtPosition = (position: Position): Building | null => {
  for (const building of buildings.values()) {
    // Size format is HxW (height x width)
    const [h = 1, w = 1] = building.size.split('x').map(Number);
    const dims = building.rotation === 90 || building.rotation === 270 
      ? { width: h, height: w } 
      : { width: w, height: h };
    
    if (
      position.x >= building.position.x &&
      position.x < building.position.x + dims.width &&
      position.y >= building.position.y &&
      position.y < building.position.y + dims.height
    ) {
      return building;
    }
  }
  return null;
};

// Handle canvas click/drag
const handleCanvasMouseDown = (event: MouseEvent) => {
  // Right click always erases
  if (event.button === 2) {
    const position = getTilePosition(event);
    handleErase(position);
    return;
  }
  
  // Left click - either pan or use tool
  if (event.button === 0) {
    // Start panning if None tool is selected or space is pressed
    if (selectedTool.value === 'none' || isSpacePressed.value) {
      isPanning.value = true;
      panStart.value = { x: event.clientX, y: event.clientY };
      return;
    }
    
    // Enable continuous placement if Shift is held
    if (isShiftPressed.value) {
      isContinuousPlacing.value = true;
    }
    
    // Use the selected tool
    const position = getTilePosition(event);
    
    if (selectedTool.value === 'erase') {
      handleErase(position);
    } else if (selectedTool.value === 'building') {
      placeBuilding(position);
    } else if (selectedTool.value === 'wire') {
      placeWire(position);
    } else if (selectedTool.value === 'entity') {
      placeEntity(position);
    }
  }
};

// Handle mouse move for panning and continuous placement
const handleCanvasMouseMove = (event: MouseEvent) => {
  // Handle panning
  if (isPanning.value && panStart.value) {
    const dx = event.clientX - panStart.value.x;
    const dy = event.clientY - panStart.value.y;
    
    gridConfig.value.offsetX = Math.max(0, (gridConfig.value.offsetX || 0) - dx);
    gridConfig.value.offsetY = Math.max(0, (gridConfig.value.offsetY || 0) - dy);
    
    panStart.value = { x: event.clientX, y: event.clientY };
    return;
  }
  
  // Handle continuous placement (Shift + LMB)
  if (isContinuousPlacing.value && event.buttons === 1) {
    const position = getTilePosition(event);
    
    if (selectedTool.value === 'erase') {
      handleErase(position);
    } else if (selectedTool.value === 'building') {
      placeBuilding(position);
    } else if (selectedTool.value === 'wire') {
      placeWire(position);
    } else if (selectedTool.value === 'entity') {
      placeEntity(position);
    }
  }
};

// Handle mouse up to stop panning and continuous placement
const handleCanvasMouseUp = () => {
  isPanning.value = false;
  panStart.value = null;
  isContinuousPlacing.value = false;
};

// Place a building
const placeBuilding = (position: Position) => {
  // Size format is HxW (height x width)
  const [h = 1, w = 1] = selectedBuildingSize.value.split('x').map(Number);
  const dims = selectedRotation.value === 90 || selectedRotation.value === 270 
    ? { width: h, height: w } 
    : { width: w, height: h };
  
  // Check if all tiles are free
  for (let x = 0; x < dims.width; x++) {
    for (let y = 0; y < dims.height; y++) {
      if (isTileOccupied({ x: position.x + x, y: position.y + y })) {
        console.log('Cannot place building: tiles occupied');
        return;
      }
    }
  }
  
  const buildingId = `building-${Date.now()}-${Math.random()}`;
  const buildingConfig = availableBuildings.find(b => b.name === selectedBuilding.value);
  const building: Building = {
    id: buildingId,
    name: buildingConfig?.name || selectedBuilding.value,
    type: buildingConfig?.item || selectedBuilding.value,
    position,
    size: selectedBuildingSize.value,
    rotation: selectedRotation.value,
    sprite: `/src/assets/buildings/${buildingConfig?.sprite || selectedBuilding.value + '.webp'}`,
    attachedWires: buildingConfig?.attachedWires?.map(w => ({
      name: w.name,
      sprite: `/src/assets/wires/${w.sprite}`,
      offsetX: w.offsetX,
      offsetY: w.offsetY,
      rotation: w.rotation as Rotation,
    })) || [],
  };
  
  buildings.set(buildingId, building);
};

// Place a wire
const placeWire = (position: Position) => {
  // Check if wire already exists
  for (const wire of wires.values()) {
    if (wire.position.x === position.x && wire.position.y === position.y) {
      console.log('Wire already exists at this position');
      return;
    }
  }
  
  // Check if there's a building at this position
  const building = getBuildingAtPosition(position);
  
  const wireConfig = availableWires.find(w => w.name === selectedWire.value);
  const wireId = `wire-${Date.now()}-${Math.random()}`;
  const wire: Wire = {
    id: wireId,
    position,
    rotation: selectedRotation.value,
    sprite: `/src/assets/wires/${wireConfig?.sprite || 'Analyzer.webp'}`,
    connectedToBuildingId: building?.id,
  };
  
  wires.set(wireId, wire);
  
  // Mark building as having wire attached
  if (building) {
    if (!building.attachedWires) building.attachedWires = [];
    building.attachedWires.push({
      name: wireConfig?.name || selectedWire.value,
      sprite: `/src/assets/wires/${wireConfig?.sprite || 'Analyzer.webp'}`,
      offsetX: wire.position.x - building.position.x,
      offsetY: wire.position.y - building.position.y,
      rotation: selectedRotation.value,
    });
  }
};

// Place an entity
const placeEntity = (position: Position) => {
  const entity = generateEntity(position);
  entities.set(entity.id, entity);
};

// Erase at position
const handleErase = (position: Position) => {
  // Erase building
  const building = getBuildingAtPosition(position);
  if (building) {
    buildings.delete(building.id);
    
    // Remove associated wires
    for (const [id, wire] of wires.entries()) {
      if (wire.connectedToBuildingId === building.id) {
        wires.delete(id);
      }
    }
    return;
  }
  
  // Erase wire (only if not connected to building)
  for (const [id, wire] of wires.entries()) {
    if (wire.position.x === position.x && wire.position.y === position.y) {
      if (!wire.connectedToBuildingId) {
        wires.delete(id);
      } else {
        console.log('Cannot erase wire attached to building');
      }
      return;
    }
  }
  
  // Erase entity
  for (const [id, entity] of entities.entries()) {
    if (entity.position.x === position.x && entity.position.y === position.y) {
      entities.delete(id);
      return;
    }
  }
};

// Rotate selected rotation
const rotateClockwise = () => {
  const rotations: Rotation[] = [0, 90, 180, 270];
  const currentIndex = rotations.indexOf(selectedRotation.value);
  selectedRotation.value = rotations[(currentIndex + 1) % 4] as Rotation;
};

const rotateCounterClockwise = () => {
  const rotations: Rotation[] = [0, 90, 180, 270];
  const currentIndex = rotations.indexOf(selectedRotation.value);
  selectedRotation.value = rotations[(currentIndex + 3) % 4] as Rotation;
};

// Select building
const selectBuilding = (building: typeof availableBuildings[0]) => {
  selectedBuilding.value = building.name;
  selectedBuildingSize.value = building.size;
  selectedTool.value = 'building';
};

// Select wire
const selectWire = (wire: typeof availableWires[0]) => {
  selectedWire.value = wire.name;
  selectedTool.value = 'wire';
};

// Select entity shape
const selectEntityShape = (shape: typeof customEntityShapes[0]) => {
  selectedEntityShape.value = shape.shape;
  selectedTool.value = 'entity';
};

// Generate shape from user input
const generateNewShape = () => {
  const shapeKey = prompt('Enter shape key (e.g., "CuCuCuCu" for uncolored circle, "RbRbRbRb" for blue rectangle):\n\nFormat: Each layer is 8 characters (4 quadrants of 2 chars each)\nShapes: C=Circle, R=Rectangle, S=Star, W=Windmill, -=Empty\nColors: r=red, g=green, b=blue, y=yellow, p=purple, c=cyan, w=white, u=uncolored\nMultiple layers separated by ":"\n\nExamples:\n- CuCuCuCu (simple circle)\n- RbRbRbRb (blue rectangle)\n- CbCbCbRb:CwCwCwCw (2-layer shape)');
  
  if (!shapeKey || shapeKey.trim() === '') {
    return;
  }
  
  let sprite = '';
  
  try {
    sprite = renderShape(shapeKey.trim(), 48);
  } catch (error) {
    console.error('Failed to render shape:', error);
    alert(`Invalid shape key: ${(error as Error).message}`);
    return;
  }
  
  // Check if shape already exists
  if (customEntityShapes.some(s => s.shape === shapeKey.trim())) {
    alert('This shape already exists!');
    selectedEntityShape.value = shapeKey.trim();
    return;
  }
  
  const shapeName = `Custom ${customEntityShapes.filter(s => s.name.startsWith('Custom')).length + 1}`;
  customEntityShapes.push({
    name: shapeName,
    shape: shapeKey.trim(),
    sprite
  });
  
  selectedEntityShape.value = shapeKey.trim();
  selectedTool.value = 'entity';
};

// Expand grid if items are within 5 cells of edge
// Clear all
const clearAll = () => {
  buildings.clear();
  wires.clear();
  entities.clear();
};

// Save current map to local storage
const saveMap = () => {
  if (!mapName.value.trim()) {
    alert('Please enter a map name');
    return;
  }
  
  saveTileMap(mapName.value, { buildings, entities, wires });
  alert(`Map "${mapName.value}" saved successfully!`);
  refreshSavedMaps();
};

// Load map from local storage
const loadMap = (name: string) => {
  const saved = loadTileMap(name);
  if (!saved) {
    alert('Map not found');
    return;
  }
  
  // Clear current maps
  clearAll();
  
  // Load buildings
  saved.buildings.forEach(building => {
    buildings.set(building.id, building);
  });
  
  // Load entities and track custom shapes
  saved.entities.forEach(entity => {
    entities.set(entity.id, entity);
    
    // Check if this entity has a custom shape not in our list
    if (entity.data?.shape) {
      const shapeExists = customEntityShapes.some(s => s.shape === entity.data.shape);
      if (!shapeExists) {
        try {
          const sprite = renderShape(entity.data.shape, 48);
          customEntityShapes.push({
            name: `Loaded ${customEntityShapes.length + 1}`,
            shape: entity.data.shape,
            sprite,
          });
        } catch (error) {
          console.error('Failed to render loaded shape:', entity.data.shape, error);
        }
      }
    }
  });
  
  // Load wires
  saved.wires.forEach(wire => {
    wires.set(wire.id, wire);
  });
  
  mapName.value = saved.name;
  showLoadDialog.value = false;
};

// Delete map from local storage
const deleteMap = (name: string) => {
  if (confirm(`Delete map "${name}"?`)) {
    deleteTileMap(name);
    refreshSavedMaps();
  }
};

// Export current map as file
const exportMap = () => {
  if (!mapName.value.trim()) {
    alert('Please enter a map name');
    return;
  }
  
  exportTileMap(mapName.value, { buildings, entities, wires });
};

// Import map from file
const handleImport = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  try {
    const imported = await importTileMap(file);
    
    // Clear current maps
    clearAll();
    
    // Load imported data
    imported.buildings.forEach(building => {
      buildings.set(building.id, building);
    });
    
    imported.entities.forEach(entity => {
      entities.set(entity.id, entity);
    });
    
    imported.wires.forEach(wire => {
      wires.set(wire.id, wire);
    });
    
    mapName.value = imported.name;
    alert(`Map "${imported.name}" imported successfully!`);
  } catch (error) {
    alert('Failed to import map: ' + (error as Error).message);
  }
  
  // Reset input
  input.value = '';
};

// Refresh saved maps list
const refreshSavedMaps = () => {
  savedMaps.value = getAllSavedMaps();
};

// Keyboard event handlers
const handleKeyDown = (event: KeyboardEvent) => {
  // Ignore keyboard shortcuts when typing in input fields
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Track modifier keys
  if (event.key === 'Shift') {
    isShiftPressed.value = true;
  }
  
  if (event.key === ' ') {
    event.preventDefault();
    if (!isSpacePressed.value) {
      isSpacePressed.value = true;
      // Save current tool and switch to temporary panning
      if (selectedTool.value !== 'none') {
        toolBeforeSpace.value = selectedTool.value;
        selectedTool.value = 'none';
      }
    }
    return;
  }
  
  // R - Rotate (clockwise by default, counter-clockwise with Shift)
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    if (selectedTool.value === 'entity') {
      // Entities cannot be rotated
      return;
    }
    if (event.shiftKey) {
      rotateCounterClockwise();
    } else {
      rotateClockwise();
    }
    return;
  }
  
  // E - Cycle tools: Building > Entity > Wire > Building
  if (event.key === 'e' || event.key === 'E') {
    event.preventDefault();
    if (selectedTool.value === 'building') {
      selectedTool.value = 'entity';
    } else if (selectedTool.value === 'entity') {
      selectedTool.value = 'wire';
    } else if (selectedTool.value === 'wire') {
      selectedTool.value = 'building';
    } else {
      // From erase or none, go to building
      selectedTool.value = 'building';
    }
  }
};

const handleKeyUp = (event: KeyboardEvent) => {
  // Ignore keyboard shortcuts when typing in input fields
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Track modifier keys
  if (event.key === 'Shift') {
    isShiftPressed.value = false;
    isContinuousPlacing.value = false;
  }
  
  if (event.key === ' ') {
    event.preventDefault();
    isSpacePressed.value = false;
    // Restore previous tool
    if (toolBeforeSpace.value) {
      selectedTool.value = toolBeforeSpace.value;
      toolBeforeSpace.value = null;
    }
  }
};

// Add keyboard event listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

// Initialize saved maps list
refreshSavedMaps();
</script>

<template>
  <div class="tile-editor">
    <div class="toolbar">
      <div class="tool-section">
        <h3>Tools</h3>
        <button 
          :class="{ active: selectedTool === 'building' }" 
          @click="selectedTool = 'building'"
        >
          Building
        </button>
        <button 
          :class="{ active: selectedTool === 'entity' }" 
          @click="selectedTool = 'entity'"
        >
          Entity
        </button>
        <button 
          :class="{ active: selectedTool === 'wire' }" 
          @click="selectedTool = 'wire'"
        >
          Wire
        </button>
        <button 
          :class="{ active: selectedTool === 'erase' }" 
          @click="selectedTool = 'erase'"
        >
          Erase
        </button>
        <button 
          :class="{ active: selectedTool === 'none' }" 
          @click="selectedTool = 'none'"
        >
          None (Pan)
        </button>
      </div>
      
      <div class="tool-section" v-if="selectedTool === 'building'">
        <h3>Buildings</h3>
        <div class="building-list">
          <button 
            v-for="building in availableBuildings" 
            :key="building.name"
            :class="{ active: selectedBuilding === building.name }"
            @click="selectBuilding(building)"
            :title="`${building.name} (${building.size})`"
          >
            <img :src="`/src/assets/buildings/${building.sprite}`" :alt="building.name" />
            <span>{{ building.size }}</span>
          </button>
        </div>
        
        <h3>Rotation</h3>
        <div class="rotation-controls">
          <button @click="rotateCounterClockwise">↶ CCW</button>
          <span>{{ selectedRotation }}°</span>
          <button @click="rotateClockwise">↷ CW</button>
        </div>
      </div>
      
      <div class="tool-section" v-if="selectedTool === 'wire'">
        <h3>Wires</h3>
        <div class="wire-list">
          <button 
            v-for="wire in availableWires" 
            :key="wire.name"
            :class="{ active: selectedWire === wire.name }"
            @click="selectWire(wire)"
            :title="wire.name"
          >
            <img :src="`/src/assets/wires/${wire.sprite}`" :alt="wire.name" />
            <span class="wire-name">{{ wire.name }}</span>
          </button>
        </div>
      </div>
      
      <div class="tool-section" v-if="selectedTool === 'entity'">
        <h3>Entity Shapes</h3>
        <div class="entity-list">
          <button 
            v-for="color in entityColorConfigs" 
            :key="color.name"
            :class="{ active: selectedEntityShape === color.name }"
            @click="() => { selectedEntityShape = color.name; selectedTool = 'entity'; }"
            :title="color.name"
          >
            <img :src="`/src/assets/entities/${color.sprite}`" :alt="color.name" />
            <span class="entity-name">{{ color.name }}</span>
          </button>
          <button 
            v-for="shape in customEntityShapes" 
            :key="shape.shape"
            :class="{ active: selectedEntityShape === shape.shape }"
            @click="selectEntityShape(shape)"
            :title="shape.name"
          >
            <img v-if="shape.sprite" :src="shape.sprite" :alt="shape.name" />
            <span class="entity-name">{{ shape.name }}</span>
          </button>
        </div>
        <button @click="generateNewShape" class="generate-shape-btn">
          ➕ Add Custom Shape
        </button>
      </div>
      
      <div class="tool-section">
        <h3>Options</h3>
        <label>
          <input type="checkbox" v-model="showGrid" />
          Show Grid
        </label>
        <button @click="clearAll" class="danger">Clear All</button>
      </div>
      
      <div class="tool-section">
        <h3>Map</h3>
        <input 
          type="text" 
          v-model="mapName" 
          placeholder="Map name" 
          class="map-name-input"
        />
        <button @click="saveMap">💾 Save</button>
        <button @click="showLoadDialog = true">📂 Load</button>
        <button @click="exportMap">📥 Export</button>
        <button @click="importInput?.click()">📤 Import</button>
        <input 
          ref="importInput" 
          type="file" 
          accept=".json" 
          @change="handleImport" 
          style="display: none;"
        />
      </div>
      
      <div class="tool-section">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>R</kbd>
            <span>Rotate clockwise</span>
          </div>
          <div class="shortcut-item">
            <kbd>Shift</kbd> + <kbd>R</kbd>
            <span>Rotate counter-clockwise</span>
          </div>
          <div class="shortcut-item">
            <kbd>E</kbd>
            <span>Cycle tools</span>
          </div>
          <div class="shortcut-item">
            <kbd>Shift</kbd> + <kbd>LMB</kbd>
            <span>Continuous placement</span>
          </div>
          <div class="shortcut-item">
            <kbd>Space</kbd>
            <span>Temporary pan (hold)</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="canvas-container" :class="{ 'cursor-grab': selectedTool === 'none' && !isPanning, 'cursor-grabbing': isPanning }">
      <TileRenderer
        :buildings="buildings"
        :entities="entities"
        :wires="wires"
        :grid-config="gridConfig"
        :show-grid="showGrid"
        :show-wire-layer="showWireLayer"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
        @contextmenu.prevent
      />
    </div>
    
    <!-- Load Dialog -->
    <div v-if="showLoadDialog" class="dialog-overlay" @click.self="showLoadDialog = false">
      <div class="dialog">
        <h2>Load Map</h2>
        <div class="saved-maps-list">
          <div 
            v-for="map in savedMaps" 
            :key="map.name" 
            class="saved-map-item"
          >
            <div class="map-info">
              <strong>{{ map.name }}</strong>
              <small>{{ new Date(map.timestamp).toLocaleString() }}</small>
            </div>
            <div class="map-actions">
              <button @click="loadMap(map.name)">Load</button>
              <button @click="deleteMap(map.name)" class="danger">Delete</button>
            </div>
          </div>
          <div v-if="savedMaps.length === 0" class="no-maps">
            No saved maps
          </div>
        </div>
        <button @click="showLoadDialog = false" class="close-dialog">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tile-editor {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #0d0d0d;
}

.toolbar {
  width: 460px;
  background: #1a1a1a;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #333;
  overflow-y: auto;
  max-height: calc(95vh - 40px);
}

.tool-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.tool-section:last-child {
  border-bottom: none;
}

h3 {
  color: #fff;
  font-size: 14px;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

button {
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

button:hover {
  background: #333;
  border-color: #666;
}

button.active {
  background: #0066cc;
  border-color: #0088ff;
}

button.danger {
  background: #cc0000;
  border-color: #ff0000;
}

button.danger:hover {
  background: #ff0000;
}

.tool-section > button {
  display: block;
  width: 100%;
  margin-bottom: 5px;
}

.building-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-bottom: 10px;
}

.wire-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  margin-bottom: 10px;
}

.wire-list button {
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 60px;
}

.wire-list button img {
  max-width: 100%;
  max-height: 40px;
  image-rendering: pixelated;
}

.wire-list button .wire-name {
  font-size: 10px;
  opacity: 0.7;
  text-align: center;
  word-wrap: break-word;
}


.building-list button {
  aspect-ratio: 1;
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.building-list button img {
  max-width: 100%;
  max-height: 32px;
  image-rendering: pixelated;
}

.building-list button span {
  font-size: 10px;
  opacity: 0.7;
}

.entity-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
  margin-bottom: 10px;
}

.entity-list button {
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 60px;
}

.entity-list button img {
  max-width: 100%;
  max-height: 40px;
  image-rendering: pixelated;
}

.entity-list button .entity-name {
  font-size: 10px;
  opacity: 0.7;
  text-align: center;
  word-wrap: break-word;
}

.generate-shape-btn {
  width: 100%;
  margin-top: 5px;
  background: #0066cc !important;
  border-color: #0088ff !important;
}

.generate-shape-btn:hover {
  background: #0088ff !important;
}

.rotation-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.rotation-controls button {
  flex: 1;
}

.rotation-controls span {
  color: #fff;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  margin-bottom: 10px;
  cursor: pointer;
}

input[type="checkbox"] {
  cursor: pointer;
}

.map-name-input {
  width: 96%;
  padding: 8px;
  margin-bottom: 10px;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
}

.map-name-input:focus {
  outline: none;
  border-color: #0088ff;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.canvas-container.cursor-grab {
  cursor: grab;
}

.canvas-container.cursor-grab canvas {
  cursor: grab;
}

.canvas-container.cursor-grabbing {
  cursor: grabbing;
}

.canvas-container.cursor-grabbing canvas {
  cursor: grabbing;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 20px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog h2 {
  margin: 0 0 15px 0;
  color: #fff;
}

.saved-maps-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.saved-map-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 4px;
  margin-bottom: 8px;
}

.map-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.map-info strong {
  color: #fff;
}

.map-info small {
  color: #888;
  font-size: 12px;
}

.map-actions {
  display: flex;
  gap: 8px;
}

.map-actions button {
  padding: 6px 12px;
  font-size: 12px;
}

.no-maps {
  text-align: center;
  color: #888;
  padding: 20px;
}

.close-dialog {
  width: 100%;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #ccc;
}

.shortcut-item kbd {
  background: #333;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 11px;
  color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.shortcut-item span {
  flex: 1;
}
</style>
