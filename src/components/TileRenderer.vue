<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Building, Wire, Entity, GridConfig, Rotation } from '../types/tile';
import { isBuildingAvailable } from '../utils/archipelago-helper';

const props = withDefaults(defineProps<{
  buildings: Map<string, Building>;
  entities: Map<string, Entity>;
  wires: Map<string, Wire>;
  gridConfig: GridConfig;
  showGrid?: boolean;
  showWireLayer?: boolean;
  canvasHeight?: string;
}>(), {
  canvasHeight: '95vh',
});

const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// Image cache
const imageCache = new Map<string, HTMLImageElement>();

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d');
    render();
  }
});

// Watch for changes and re-render
watch(() => [props.buildings, props.entities, props.wires, props.gridConfig, props.showGrid, props.showWireLayer], () => {
  render();
}, { deep: true });

// Preload image
const loadImage = (src: string): Promise<HTMLImageElement> => {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Get building dimensions based on size and rotation
// Size format is HxW (height x width), e.g., "1x2" = 1 high, 2 wide
const getBuildingDimensions = (size: string, rotation: Rotation): { width: number; height: number } => {
  const [h = 1, w = 1] = size.split('x').map(Number);
  
  // Swap dimensions for 90 and 270 degree rotations
  if (rotation === 90 || rotation === 270) {
    return { width: h, height: w };
  }
  
  return { width: w, height: h };
};

// Draw grid
const drawGrid = () => {
  if (!ctx.value || !props.showGrid) return;

  const { tileSize, width, height, offsetX = 0, offsetY = 0 } = props.gridConfig;
  
  ctx.value.strokeStyle = '#333';
  ctx.value.lineWidth = 1;

  // Calculate visible grid range based on offset
  const startX = Math.floor(offsetX / tileSize);
  const startY = Math.floor(offsetY / tileSize);
  const endX = width + Math.ceil(offsetX / tileSize);
  const endY = height + Math.ceil(offsetY / tileSize);

  // Vertical lines
  for (let x = startX; x <= endX; x++) {
    ctx.value.beginPath();
    ctx.value.moveTo(x * tileSize, startY * tileSize);
    ctx.value.lineTo(x * tileSize, endY * tileSize);
    ctx.value.stroke();
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y++) {
    ctx.value.beginPath();
    ctx.value.moveTo(startX * tileSize, y * tileSize);
    ctx.value.lineTo(endX * tileSize, y * tileSize);
    ctx.value.stroke();
  }
};

// Draw a rotated image
const drawRotatedImage = (
  img: HTMLImageElement,
  x: number,
  y: number,
  originalWidth: number,
  originalHeight: number,
  boundingWidth: number,
  boundingHeight: number,
  rotation: Rotation
) => {
  if (!ctx.value) return;

  ctx.value.save();
  
  // Move to center of the bounding box (rotated dimensions)
  const centerX = x + boundingWidth / 2;
  const centerY = y + boundingHeight / 2;
  ctx.value.translate(centerX, centerY);
  
  // Rotate
  ctx.value.rotate((rotation * Math.PI) / 180);
  
  // Draw image with original dimensions, centered
  ctx.value.drawImage(img, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
  
  ctx.value.restore();
};

// Render all layers
const render = async () => {
  if (!ctx.value || !canvas.value) return;

  const { tileSize, width, height, offsetX = 0, offsetY = 0 } = props.gridConfig;
  
  // Clear canvas
  ctx.value.clearRect(0, 0, width * tileSize, height * tileSize);
  
  // Draw background
  ctx.value.fillStyle = '#1a1a1a';
  ctx.value.fillRect(0, 0, width * tileSize, height * tileSize);
  
  // Save context and apply camera offset
  ctx.value.save();
  ctx.value.translate(-offsetX, -offsetY);
  
  // Draw grid
  drawGrid();
  
  // Draw buildings layer (bottom)
  for (const building of props.buildings.values()) {
    try {
      const img = await loadImage(building.sprite);
      
      // Get original dimensions (HxW format)
      const [h = 1, w = 1] = building.size.split('x').map(Number);
      const originalWidth = w * tileSize;
      const originalHeight = h * tileSize;
      
      // Get rotated bounding box dimensions
      const dims = getBuildingDimensions(building.size, building.rotation);
      const boundingWidth = dims.width * tileSize;
      const boundingHeight = dims.height * tileSize;
      
      const x = building.position.x * tileSize;
      const y = building.position.y * tileSize;
      
      drawRotatedImage(img, x, y, originalWidth, originalHeight, boundingWidth, boundingHeight, building.rotation);
      
      // Draw red overlay if building is unavailable
      if (!isBuildingAvailable(building.type)) {
        ctx.value.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.value.fillRect(
          x,
          y,
          boundingWidth,
          boundingHeight
        );
      }
    } catch (error) {
      // Fallback: draw a colored rectangle
      const dims = getBuildingDimensions(building.size, building.rotation);
      ctx.value.fillStyle = '#00aaff';
      ctx.value.fillRect(
        building.position.x * tileSize + 2,
        building.position.y * tileSize + 2,
        dims.width * tileSize - 4,
        dims.height * tileSize - 4
      );
    }
  }
  
  // Draw entities layer (middle)
  for (const entity of props.entities.values()) {
    try {
      const img = await loadImage(entity.sprite);
      const x = entity.position.x * tileSize;
      const y = entity.position.y * tileSize;
      ctx.value.drawImage(img, x, y, tileSize, tileSize);
    } catch (error) {
      // Fallback: draw a colored circle
      ctx.value.fillStyle = '#ffaa00';
      ctx.value.beginPath();
      ctx.value.arc(
        entity.position.x * tileSize + tileSize / 2,
        entity.position.y * tileSize + tileSize / 2,
        tileSize / 3,
        0,
        Math.PI * 2
      );
      ctx.value.fill();
    }
  }
  
  // Draw semi-transparent green background layer
  if (props.showWireLayer) {
    const offsetX = props.gridConfig.offsetX || 0;
    const offsetY = props.gridConfig.offsetY || 0;
    const startX = Math.floor(offsetX / tileSize) * tileSize;
    const startY = Math.floor(offsetY / tileSize) * tileSize;
    
    ctx.value.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.value.fillRect(startX, startY, (width + 2) * tileSize, (height + 2) * tileSize);
  }
  
  // Draw wires layer (top) - only if enabled
  if (props.showWireLayer) {
    for (const wire of props.wires.values()) {
      try {
        const img = await loadImage(wire.sprite);
        const x = wire.position.x * tileSize;
        const y = wire.position.y * tileSize;
        drawRotatedImage(img, x, y, tileSize, tileSize, tileSize, tileSize, wire.rotation);
      } catch (error) {
        // Fallback: draw a colored rectangle
        ctx.value.fillStyle = '#ff6600';
        ctx.value.fillRect(
          wire.position.x * tileSize + 2,
          wire.position.y * tileSize + 2,
          tileSize - 4,
          tileSize - 4
        );
      }
    }
  }
  
  // Restore context (remove camera offset)
  ctx.value.restore();
};

defineExpose({ render });
</script>

<template>
  <canvas
    ref="canvas"
    :width="gridConfig.width * gridConfig.tileSize"
    :height="gridConfig.height * gridConfig.tileSize"
    :style="{ maxHeight: canvasHeight }"
    class="tile-canvas"
  />
</template>

<style scoped>
.tile-canvas {
  border: 2px solid #444;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
