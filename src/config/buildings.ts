
import type { BuildingSize, Rotation } from '../types/tile';


export interface BuildingConfig {
  name: string;
  size: BuildingSize;
  sprite: string;
  item?: string;
  attachedWires?: WireConnectedToBuilding[];
}

export interface WireConfig {
  name: string;
  sprite: string;
  item?: string;
}

export interface WireConnectedToBuilding extends WireConfig {
  offsetX: number;
  offsetY: number;
  rotation: Rotation;
}

const wiresPath = 'assets/wires/';
// Building configurations
// Size format: HxW (height x width) - e.g., '1x2' = 1 tile high, 2 tiles wide
export const buildingConfigs: BuildingConfig[] = [
  { name: 'Belt_top', size: '1x1', sprite: 'Belt_top.webp', item: 'Belt' },
  { name: 'Belt_left', size: '1x1', sprite: 'Belt_left.png', item: 'Belt' },
  { name: 'Belt_right', size: '1x1', sprite: 'Belt_right.png', item: 'Belt' },
  { name: 'Belt-Reader', size: '1x1', sprite: 'Belt-Reader.png', item: 'Belt Reader',
    attachedWires: [
      { name: 'Signal_output_double', sprite: `${wiresPath}Signal_output_double.png`, offsetX: 0, offsetY: 0, rotation: 0 }
    ]
  },
  { name: 'Balancer', size: '1x2', sprite: 'Balancer.webp', item: 'Balancer' },
  { name: 'Color_mixer', size: '1x2', sprite: 'Color_mixer.webp', item: 'Color Mixer' },
  { name: 'Cutter', size: '1x2', sprite: 'Cutter.webp', item: 'Cutter' },
  { name: 'Cutter-quad', size: '1x4', sprite: 'Cutter-quad.webp', item: 'Quad Cutter' },
  { name: 'Display', size: '1x1', sprite: 'Display.webp', item: 'Display',
    attachedWires: [
      { name: 'Signal_input', sprite: `${wiresPath}Signal_input.png`, offsetX: 0, offsetY: 0, rotation: 0 }
    ]
   },
  { name: 'Filter', size: '1x2', sprite: 'Filter.webp', item: 'Item Filter',
    attachedWires: [
      { name: 'Signal_input', sprite: `${wiresPath}Signal_input.png`, offsetX: 0, offsetY: 0, rotation: 90 }
    ]
  },
  { name: 'Hub', size: '4x4', sprite: 'Hub.webp', 
    attachedWires: [
      { name: 'Signal_output_shape', sprite: `${wiresPath}Signal_output_shape.png`, offsetX: 0, offsetY: 2, rotation: 90 },
    ]
   },
  { name: 'Lever', size: '1x1', sprite: 'Lever.webp', item: 'Switch', 
    attachedWires: [
      { name: 'Signal_output_binary', sprite: `${wiresPath}Signal_output_binary.png`, offsetX: 0, offsetY: 0, rotation: 180 }
    ]
  },
  { name: 'Lever_on', size: '1x1', sprite: 'Lever_on.webp', item: 'Switch',
    attachedWires: [
      { name: 'Signal_output_binary', sprite: `${wiresPath}Signal_output_binary.png`, offsetX: 0, offsetY: 0, rotation: 180 }
    ]
   },
  { name: 'Merger-compact-L', size: '1x1', sprite: 'Merger-compact-L.webp', item: 'Compact Merger' },
  { name: 'Merger-compact-R', size: '1x1', sprite: 'Merger-compact-R.webp', item: 'Compact Merger' },
  { name: 'Miner', size: '1x1', sprite: 'Miner.webp', item: 'Extractor' },
  { name: 'Miner-chainable', size: '1x1', sprite: 'Miner-chainable.webp', item: 'Chaining Extractor' },
  { name: 'Painter', size: '1x2', sprite: 'Painter.webp', item: 'Painter' },
  { name: 'Painter-double', size: '2x2', sprite: 'Painter-double.webp', item: 'Double Painter' },
  { name: 'Painter-mirrored', size: '1x2', sprite: 'Painter-mirrored.webp', item: 'Painter' },
  { name: 'Painter-quad', size: '1x4', sprite: 'Painter-quad.webp', item: 'Quad Painter',
    attachedWires: [
      { name: 'Signal_input', sprite: `${wiresPath}Signal_input.png`, offsetX: 0, offsetY: 0, rotation: 0 },
      { name: 'Signal_input', sprite: `${wiresPath}Signal_input.png`, offsetX: 1, offsetY: 0, rotation: 0 },
      { name: 'Signal_input', sprite: `${wiresPath}Signal_input.png`, offsetX: 2, offsetY: 0, rotation: 0 },
      { name: 'Signal_input', sprite: `${wiresPath}Signal_input.png`, offsetX: 3, offsetY: 0, rotation: 0 }
    ]
   },
  { name: 'Rotater', size: '1x1', sprite: 'Rotater.webp', item: 'Rotator' },
  { name: 'Rotater-180', size: '1x1', sprite: 'Rotater-180.webp', item: 'Rotator (180°)' },
  { name: 'Rotater-ccw', size: '1x1', sprite: 'Rotater-ccw.webp', item: 'Rotator (CCW)' },
  { name: 'Splitter-compact-L', size: '1x1', sprite: 'Splitter-compact-L.webp', item: 'Compact Splitter' },
  { name: 'Splitter-compact-R', size: '1x1', sprite: 'Splitter-compact-R.webp', item: 'Compact Splitter' },
  { name: 'Stacker', size: '1x2', sprite: 'Stacker.webp', item: 'Stacker' },
  { name: 'Storage', size: '2x2', sprite: 'Storage.png', item: 'Storage',
    attachedWires: [
      { name: 'Signal_output_binary', sprite: `${wiresPath}Signal_output_binary.png`, offsetX: 0, offsetY: 1, rotation: 90 },
      { name: 'Signal_output', sprite: `${wiresPath}Signal_output.png`, offsetX: 1, offsetY: 1, rotation: 270 }
    ]
   },
  { name: 'Trash', size: '1x1', sprite: 'Trash.webp', item: 'Trash' },
  { name: 'Underground_belt_entry', size: '1x1', sprite: 'Underground_belt_entry.webp', item: 'Tunnel' },
  { name: 'Underground_belt_entry-tier2', size: '1x1', sprite: 'Underground_belt_entry-tier2.webp', item: 'Tunnel Tier II' },
  { name: 'Underground_belt_exit', size: '1x1', sprite: 'Underground_belt_exit.webp', item: 'Tunnel' },
  { name: 'Underground_belt_exit-tier2', size: '1x1', sprite: 'Underground_belt_exit-tier2.webp', item: 'Tunnel Tier II' },
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

export const wireConfigs : WireConfig[] = [
  { name: 'Green_wire_top', sprite: 'Green_wire_top.png', item: 'Wire' },
  { name: 'Green_wire_corner', sprite: 'Green_wire_corner.png', item: 'Wire' },
  { name: 'Green_wire_cross', sprite: 'Green_wire_cross.png', item: 'Wire' },
  { name: 'Green_wire_T', sprite: 'Green_wire_T.png', item: 'Wire' },
  { name: 'Blue_wire_top', sprite: 'Blue_wire_top.png', item: 'Wire' },
  { name: 'Blue_wire_corner', sprite: 'Blue_wire_corner.png', item: 'Wire' },
  { name: 'Blue_wire_cross', sprite: 'Blue_wire_cross.png', item: 'Wire' },
  { name: 'Blue_wire_T', sprite: 'Blue_wire_T.png', item: 'Wire' },
  { name: 'Wire_tunnel', sprite: 'Wire_tunnel.webp', item: 'Wire' },
  { name: 'Constant', sprite: 'Constant.png', item: 'Constant Signal' },
  { name: 'Logic_gate-and', sprite: 'Logic_gate-and.webp', item: 'Logic Gates' },
  { name: 'Logic_gate-not', sprite: 'Logic_gate-not.webp', item: 'Logic Gates' },
  { name: 'Logic_gate-or', sprite: 'Logic_gate-or.webp', item: 'Logic Gates' },
  { name: 'Logic_gate-xor', sprite: 'Logic_gate-xor.webp', item: 'Logic Gates' },
  { name: 'Transistor_L', sprite: 'Transistor_L.webp', item: 'Logic Gates' },
  { name: 'Transistor_R', sprite: 'Transistor_R.webp', item: 'Logic Gates' },
  // FIX: Make sure which item "Analyzer" and "Comparator" should be
  { name: 'Analyzer', sprite: 'Analyzer.webp', item: 'Virtual Processing' },
  { name: 'Comparator', sprite: 'Comparator.webp', item: 'Virtual Processing' },
  { name: 'Virtual_processor-cutter', sprite: 'Virtual_processor-cutter.webp', item: 'Virtual Processing' },
  { name: 'Virtual_processor-painter', sprite: 'Virtual_processor-painter.webp', item: 'Virtual Processing' },
  { name: 'Virtual_processor-rotater', sprite: 'Virtual_processor-rotater.webp', item: 'Virtual Processing' },
  { name: 'Virtual_processor-stacker', sprite: 'Virtual_processor-stacker.webp', item: 'Virtual Processing' },
  { name: 'Virtual_processor-unstacker', sprite: 'Virtual_processor-unstacker.webp', item: 'Virtual Processing' },
  { name: 'Signal_output', sprite: `Signal_output.png` },
  { name: 'Signal_output_binary', sprite: `Signal_output_binary.png` },
  { name: 'Signal_output_shape', sprite: `Signal_output_shape.png` },
  { name: 'Signal_output_double', sprite: `Signal_output_double.png` },
  { name: 'Signal_input', sprite: `Signal_input.png` },
];
