<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import TileRenderer from '../components/TileRenderer.vue';
import type { Building, Wire, Entity, GridConfig } from '../types/tile';
import { getAllSavedMaps, loadTileMap } from '../utils/storage';
import type { SavedTileMap } from '../utils/storage';

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

// Viewer state
const savedMaps = ref<SavedTileMap[]>([]);
const selectedMapName = ref<string>('');
const showGrid = ref(true);
const showWireLayer = ref(false);

// Load a map
const loadMap = (name: string) => {
  const saved = loadTileMap(name);
  if (!saved) {
    alert('Map not found');
    return;
  }
  
  // Clear current maps
  buildings.clear();
  entities.clear();
  wires.clear();
  
  // Load buildings
  saved.buildings.forEach(building => {
    buildings.set(building.id, building);
  });
  
  // Load entities
  saved.entities.forEach(entity => {
    entities.set(entity.id, entity);
  });
  
  // Load wires
  saved.wires.forEach(wire => {
    wires.set(wire.id, wire);
  });
  
  selectedMapName.value = name;
};

// Refresh saved maps list
const refreshSavedMaps = () => {
  savedMaps.value = getAllSavedMaps();
  
  // Auto-load first map if available
  if (savedMaps.value.length > 0 && !selectedMapName.value && savedMaps.value[0]) {
    loadMap(savedMaps.value[0].name);
  }
};

// Initialize
onMounted(() => {
  refreshSavedMaps();
});
</script>

<template>
  <div class="tile-viewer">
    <div class="sidebar">
      <h2>Tile Map Viewer</h2>
      
      <div class="section">
        <h3>Saved Maps</h3>
        <div class="maps-list">
          <button
            v-for="map in savedMaps"
            :key="map.name"
            :class="{ active: selectedMapName === map.name }"
            @click="loadMap(map.name)"
          >
            <strong>{{ map.name }}</strong>
            <small>{{ new Date(map.timestamp).toLocaleString() }}</small>
          </button>
          <div v-if="savedMaps.length === 0" class="no-maps">
            No saved maps. Create one in the <a href="editor.html">editor</a>.
          </div>
        </div>
      </div>
      
      <div class="section">
        <h3>Display Options</h3>
        <label>
          <input type="checkbox" v-model="showGrid" />
          Show Grid
        </label>
        <label>
          <input type="checkbox" v-model="showWireLayer" />
          Show Wire Layer
        </label>
      </div>
      
      <div class="section">
        <a href="editor.html" class="edit-button">Go to Editor</a>
      </div>
    </div>
    
    <div class="canvas-container">
      <div v-if="selectedMapName" class="map-title">
        <h1>{{ selectedMapName }}</h1>
      </div>
      <TileRenderer
        v-if="selectedMapName"
        :buildings="buildings"
        :entities="entities"
        :wires="wires"
        :grid-config="gridConfig"
        :show-grid="showGrid"
        :show-wire-layer="showWireLayer"
        canvas-height="90vh"
      />
      <div v-else class="no-selection">
        <p>Select a map from the sidebar to view</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tile-viewer {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #0d0d0d;
  min-height: 100vh;
}

.sidebar {
  width: 300px;
  background: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #333;
  overflow-y: auto;
  max-height: calc(100vh - 40px);
}

.sidebar h2 {
  color: #fff;
  margin: 0 0 20px 0;
  font-size: 20px;
}

.section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.section:last-child {
  border-bottom: none;
}

h3 {
  color: #fff;
  font-size: 14px;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.maps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.maps-list button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.maps-list button:hover {
  background: #333;
  border-color: #666;
}

.maps-list button.active {
  background: #0066cc;
  border-color: #0088ff;
}

.maps-list button strong {
  font-size: 14px;
}

.maps-list button small {
  font-size: 11px;
  opacity: 0.7;
}

.no-maps {
  color: #888;
  padding: 20px;
  text-align: center;
  line-height: 1.6;
}

.no-maps a {
  color: #0088ff;
  text-decoration: none;
}

.no-maps a:hover {
  text-decoration: underline;
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

.edit-button {
  display: block;
  width: 100%;
  padding: 12px;
  background: #0066cc;
  color: #fff;
  border: 1px solid #0088ff;
  border-radius: 4px;
  text-align: center;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.2s;
}

.edit-button:hover {
  background: #0088ff;
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
}

.map-title {
  text-align: center;
}

.map-title h1 {
  color: #fff;
  margin: 0;
  font-size: 28px;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #888;
  font-size: 18px;
}
</style>
