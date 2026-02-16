import type { BuildingSize } from '../types/tile';

export interface BuildingConfig {
  name: string;
  size: BuildingSize;
  sprite: string;
}

// Building configurations
// Size format: HxW (height x width) - e.g., '1x2' = 1 tile high, 2 tiles wide
export const buildingConfigs: BuildingConfig[] = [
  { name: 'Belt_top', size: '1x1', sprite: 'Belt_top.webp' },
  { name: 'Belt_left', size: '1x1', sprite: 'Belt_left.webp' },
  { name: 'Belt_right', size: '1x1', sprite: 'Belt_right.webp' },
  { name: 'Balancer', size: '1x2', sprite: 'Balancer.webp' },
  { name: 'Color_mixer', size: '1x2', sprite: 'Color_mixer.webp' },
  { name: 'Cutter', size: '1x2', sprite: 'Cutter.webp' },
  { name: 'Cutter-quad', size: '1x4', sprite: 'Cutter-quad.webp' },
  { name: 'Display', size: '1x1', sprite: 'Display.webp' },
  { name: 'Filter', size: '1x1', sprite: 'Filter.webp' },
  { name: 'Hub', size: '4x4', sprite: 'Hub.webp' },
  { name: 'Lever', size: '1x1', sprite: 'Lever.webp' },
  { name: 'Lever_on', size: '1x1', sprite: 'Lever_on.webp' },
  { name: 'Merger-compact-L', size: '1x1', sprite: 'Merger-compact-L.webp' },
  { name: 'Merger-compact-R', size: '1x1', sprite: 'Merger-compact-R.webp' },
  { name: 'Miner', size: '1x1', sprite: 'Miner.webp' },
  { name: 'Miner-chainable', size: '1x1', sprite: 'Miner-chainable.webp' },
  { name: 'Painter', size: '1x2', sprite: 'Painter.webp' },
  { name: 'Painter-double', size: '2x2', sprite: 'Painter-double.webp' },
  { name: 'Painter-mirrored', size: '1x2', sprite: 'Painter-mirrored.webp' },
  { name: 'Painter-quad', size: '1x4', sprite: 'Painter-quad.webp' },
  { name: 'Rotater', size: '1x1', sprite: 'Rotater.webp' },
  { name: 'Rotater-180', size: '1x1', sprite: 'Rotater-180.webp' },
  { name: 'Rotater-ccw', size: '1x1', sprite: 'Rotater-ccw.webp' },
  { name: 'Splitter-compact-L', size: '1x1', sprite: 'Splitter-compact-L.webp' },
  { name: 'Splitter-compact-R', size: '1x1', sprite: 'Splitter-compact-R.webp' },
  { name: 'Stacker', size: '1x2', sprite: 'Stacker.webp' },
  { name: 'Trash', size: '1x1', sprite: 'Trash.webp' },
  { name: 'Underground_belt_entry', size: '1x1', sprite: 'Underground_belt_entry.webp' },
  { name: 'Underground_belt_entry-tier2', size: '1x1', sprite: 'Underground_belt_entry-tier2.webp' },
  { name: 'Underground_belt_exit', size: '1x1', sprite: 'Underground_belt_exit.webp' },
  { name: 'Underground_belt_exit-tier2', size: '1x1', sprite: 'Underground_belt_exit-tier2.webp' },
];

export const entityColorConfigs = [
    { name: 'red', sprite: 'red.png' },
    { name: 'green', sprite: 'green.png' },
    { name: 'blue', sprite: 'blue.png' },
    { name: 'cyan', sprite: 'cyan.png' },
    { name: 'magenta', sprite: 'magenta.png' },
    { name: 'yellow', sprite: 'yellow.png' },
    { name: 'white', sprite: 'white.png' },
];

export const entityShapeConfigs = [
    { name: 'Circle', shape: 'CuCuCuCu' },
    { name: 'Rectangle', shape: 'RuRuRuRu' },
    { name: 'Windmill', shape: 'WuWuWuWu' },
    { name: 'Star', shape: 'SuSuSuSu' },
    { name: 'Blueprint', shape: 'CbCbCbRb:CwCwCwCw' },
    { name: 'Logo_Shape', shape: 'RuCw--Cw:----Ru--'},
    { name: 'Rocket_Shape', shape: 'CbCuCbCu:Sr------:--CrSrCr:CwCwCwCw' }
];

export const wireConfigs = [
  { name: 'Analyzer', sprite: 'Analyzer.webp' },
  { name: 'Comparator', sprite: 'Comparator.webp' },
  { name: 'Logic_gate-and', sprite: 'Logic_gate-and.webp' },
  { name: 'Logic_gate-not', sprite: 'Logic_gate-not.webp' },
  { name: 'Logic_gate-or', sprite: 'Logic_gate-or.webp' },
  { name: 'Logic_gate-xor', sprite: 'Logic_gate-xor.webp' },
  { name: 'Transistor', sprite: 'Transistor.webp' },
  { name: 'Virtual_processor-cutter', sprite: 'Virtual_processor-cutter.webp' },
  { name: 'Virtual_processor-painter', sprite: 'Virtual_processor-painter.webp' },
  { name: 'Virtual_processor-rotater', sprite: 'Virtual_processor-rotater.webp' },
  { name: 'Virtual_processor-stacker', sprite: 'Virtual_processor-stacker.webp' },
  { name: 'Virtual_processor-unstacker', sprite: 'Virtual_processor-unstacker.webp' },
  { name: 'Wire_tunnel', sprite: 'Wire_tunnel.webp' },
];
