<template>
    <div class="templates-tab">
        <div class="config-panel">
            <select name="map-select" id="map-select" v-model="selectedMapName" @change="loadMap(selectedMapName)">
                <option v-for="map in savedMaps" :key="map.name" :value="map.name">
                    {{ map.name }}
                </option>
            </select>

            <label>
                <input type="checkbox" v-model="showGrid" />
                Show Grid
            </label>
            <label>
                <input type="checkbox" v-model="showWireLayer" />
                Show Wire Layer
            </label>
        </div>

        <div class="canvas-container">
        <TileRenderer
            v-if="selectedMapName"
            :buildings="buildings"
            :entities="entities"
            :wires="wires"
            :grid-config="gridConfig"
            :show-grid="showGrid"
            :show-wire-layer="showWireLayer"
            canvas-width="100vw"
            canvas-height="85vh"
        />
        <div v-else class="no-selection">
            <p>Select a map from the sidebar to view</p>
      </div>
    </div>
    </div>
</template>


<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import TileRenderer from '@/components/TileRenderer.vue';
import type { Building, Wire, Entity, GridConfig } from '../../types/tile';
import { getAllSavedMaps, loadTileMap } from '../../utils/storage';
import type { SavedTileMap } from '../../utils/storage';

const props = defineProps<{ apService: object }>();

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

    buildings.clear();
    entities.clear();
    wires.clear();

    saved.buildings.forEach(building => {
        buildings.set(building.id, building);
    });

    saved.entities.forEach(entity => {
        entities.set(entity.id, entity);
    });

    saved.wires.forEach(wire => {
        wires.set(wire.id, wire);
    });

    selectedMapName.value = name;
};

// Refresh saved maps list
const refreshSavedMaps = () => {
    savedMaps.value = getAllSavedMaps();

    if (savedMaps.value.length > 0 && !selectedMapName.value && savedMaps.value[0]) {
        loadMap(savedMaps.value[0].name);
    }
};

onMounted(() => {
    refreshSavedMaps();
});
</script>

<style>
</style>