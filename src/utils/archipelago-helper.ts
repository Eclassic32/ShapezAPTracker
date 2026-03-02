// @ts-nocheck

import { Client } from "archipelago.js"
import { markRaw } from "vue"
import { shapesanityArrayToCodes, shapesanityRegion } from "./shapesanity";
import { fromShortKey, renderShape } from "./shape-generator";

class ArchipelagoService {
  constructor() {
    this.client = markRaw(new Client())
    this.hints = markRaw([])
    this.items = {};
    this.shapesanity = {};

    this.client.messages.on('message', (message) => {
      console.log('💬', message);
    });

    // --- HINTS ---
    this.client.items.on('hintsInitialized', (hints) => {
      console.log('Hints initialized:', hints);
      this.hints = markRaw(hints);
    });

    this.client.items.on('hintReceived', (hint) => {
      console.log('❔', hint);
      const exists = this.hints.some(h =>
        h.item.locationName === hint.item.locationName &&
        h.item.name === hint.item.name &&
        h.item.receiver.slot === hint.item.receiver.slot
      );
      if (!exists) {
        this.hints.push(hint);
      }
    });

    this.client.items.on('hintFound', (hint) => {
      console.log('❓', hint);
      const index = this.hints.findIndex(h => h.item.toString() === hint.item.toString());
      if (index !== -1) {
        this.hints[index].found = true;
      }
    });


  }

  async connect(address, slot, password, game) {
    this.slotData = await this.client.login(address, slot, game, { password })

    this.getHints();
    this.getShapesanity();
    this.getReceivedItems();
    this.getUniqueReceivedItems();

    return this.slotData;
  }

  disconnect() {
    this.client.disconnect();
  }

  getThisPlayer() {
    return {
      name: this.client.players.self.name,
      slot: this.client.players.self.slot,
      game: this.client.players.self.game
    };
  }

  getHints() {
    return this.hints.map(h => ({
      location: h.item.locationName,
      item: h.item.name,
      receiver: {
        name: h.item.receiver.name,
        slot: h.item.receiver.slot,
        game: h.item.receiver.game
      },
      sender: {
        name: h.item.sender.name,
        slot: h.item.sender.slot,
        game: h.item.sender.game
      },
      type: (h.item.progression ? 'Progression' : 
              h.item.useful ? 'Useful' : 
              h.item.filler ? 'Filler' :
              h.item.trap ? 'Trap' : 'Unknown'
      ),
      flags: h.item.flags,
      found: h.found
    }))
  }

  getSlotData() {
    return this.slotData;
  }

  getShapesanityRaw() {
    if (this.shapesanity?.raw) return this.shapesanity.raw;
    const shapesanityRaw = this.slotData?.shapesanity;
    this.shapesanity.raw = shapesanityRaw;
    return shapesanityRaw;
  }
  
  getShapesanityCodes() {
    if (this.shapesanity?.codes) return this.shapesanity.codes;
    const raw = this.getShapesanityRaw();
    if (!raw) return null;

    const codes = shapesanityArrayToCodes(raw);
    this.shapesanity.codes = codes;
    return codes;
  }

  getShapesanityParsed() {
    if (this.shapesanity?.parsed) return this.shapesanity.parsed;
    const raw = this.getShapesanityRaw();
    const codes = this.getShapesanityCodes();
    if (!codes || !raw) return null;
    
    let parsed = [];
    raw.forEach((name, index) => {
      parsed.push({
        code: codes[name],
        name,
        location: `Shapesanity ${index + 1}`,
        shape: fromShortKey(codes[name]),
        image: renderShape(codes[name]),
        hint: -1, // Hint id, "-1" is no hint
        found: false,
        logic: assignShapeLogic(fromShortKey(codes[name]), name),
      });
    });
    this.shapesanity.parsed = parsed;
    return this.shapesanity.parsed;
  }

  // Shapesanity Alias
  getShapesanity () { return this.getShapesanityParsed(); }

  getReceivedItems() {
    this.items.all = this.client.items.received.map(i => i.name);
    return this.items.all;
  }
  
  getUniqueReceivedItems() {
    this.items.unique = [...new Set(this.getReceivedItems())];
    return this.items.unique;
  }
}

export const apService = new ArchipelagoService()

// backport function, will be replaced
export function isBuildingAvailable(name) {
  if (!name) return true; // if no name provided, assume available
  if (!apService.getSlotData()) return true; // if not connected, assume all are available

  
  
  const items = apService.getReceivedItems();
  // console.log("Is building available: ", name, items.includes(name));
  return items.includes(name);
  
}

class Logic {
  constructor() {
    this.items = apService.items.unique;
  }

  static count(item) {
    return apService.items.all.filter(i => i === item).length;
  }

  static has(item) {
    return apService.items.unique.includes(item);
  }
  
  static hasAny(items) {
    return items.some(item => apService.items.unique.includes(item));
  }

  static hasAll(items) {
    return items.every(item => apService.items.unique.includes(item));
  }

  static canCutHalf() {
    return this.has('Cutter');
  }

  static canRotate90(){
    return this.hasAny(['Rotator', 'Rotator (CCW)']);
  }

  static canRotate180() {
    return this.hasAny(['Rotator', 'Rotator (180°)', 'Rotator (CCW)']);
  }

  static canStack() {
    return this.has('Stacker');
  }

  static canPaint() {
    return this.hasAny(['Painter', 'Double Painter']) || this.canUseQuadPainter();
  }

  static canMixColors() {
    return this.has('Color Mixer');
  }

  static hasTunnel() {
    return this.hasAny(['Tunnel', 'Tunnel Tier II']);
  }

  static hasBalancer() {
    return this.has('Balancer') || this.hasAll(['Compact Merger', 'Compact Splitter']);
  }

  static canUseQuadPainter() {
    return this.hasAll(['Quad Painter', 'Wire']) && this.hasAny(['Switch', 'Constant Signal']);
  }

  static canMakeStitchedShape(floating: boolean){
    return this.canStack() && ((this.has('Quad Cutter') && !floating) || (this.canCutHalf() && this.canRotate90()));
  }

  static canBuildMAM(floating: Boolean) {
    return this.canMakeStitchedShape(floating) && this.canPaint() && 
          this.canMixColors() && this.hasBalancer() && this.hasTunnel();
  }

  static canMakeEastWindmill() {
    // Only used for shapesanity => single layers
    return this.canStack() && (this.has('Quad Cutter') || (this.canCutHalf() && this.canRotate180()));
  }

  static canMakeHalfHalfShape() {
    // Only used for shapesanity => single layers
    return this.canStack() && this.hasAny(['Quad Cutter', 'Cutter']);
  }

  static canMakeHalfShape(){
    // Only used for shapesanity => single layers
    return this.canCutHalf() || this.hasAll(['Quad Cutter', 'Stacker']);
  }

  static hasXbeltMultiplier(needed: number) {
    let mult = 1;
  }

  // Note: Seems to be not used in shapesanity?
  static hasFloatingCorner(shape) {
    const layers = shape.length;
    const corners = shape[0].length;

    for (let layer = 0; layer < layers; layer++) {
      for (let corner = 0; corner < corners; corner++) {
        
        // If current corner is absent
        if (shape[layer][corner] === null) {
          
          // Check all higher layers at same corner index
          for (let higherLayer = layer + 1; higherLayer < layers; higherLayer++) {
            if (shape[higherLayer][corner] !== null) {
              return true; // Floating detected
            }
          }
        }
      }
    }

    return false; // No floating corners found
  }
}

const regionsLogic = {
  full: [],
  east_wind: ["canMakeEastWindmill"],
  half_half: ["canMakeHalfHalfShape"],
  half: ["canMakeHalfShape"],
  piece: ["canCutHalf"],
  stitched: ["canMakeStitchedShape"],
}

export function assignShapeLogic(shape, name) {
  if (!shape) return false; // if no shape provided, assume available
  
  let logic = [];
  const items = apService.items.unique;

  let floating = Logic.hasFloatingCorner(shape);
  
  // Check for Color Logic
  if (shape.some(layer => layer.some(corner => corner && corner.color != 'uncolored'))) {
    logic.push("canPaint");
  }

  // Check for Mixed Colors Logic
  const mixedColors= ["cyan", "magenta", "yellow", "white"];
  if (shape.some(layer => layer.some(corner => corner && mixedColors.includes(corner.color)))) {
    logic.push("canMixColors");
  }

  // Check for Multi Layer Stacking Logic
  if (shape.length > 1) {
    logic.push("canStack");
  }

  // Region Logic
  const region = shapesanityRegion(name);
  if (regionsLogic[region]) {
    logic.push(...regionsLogic[region]);
  }


  return logic;
}

export function isInLogic(logic) {
  if (!logic) return true; // if no logic provided, assume available
  let result = true;

  logic.forEach(condition => {
    if (typeof Logic[condition] === "function") {
      result = result && Logic[condition]();
    }
  });

  return result;
}