// @ts-nocheck

import { Client, Player } from "archipelago.js"
import { markRaw, ref, shallowRef, triggerRef } from "vue"
import { shapesanityArrayToCodes, shapesanityRegion } from "./shapesanity";
import { fromShortKey, renderShape } from "./shape-generator";

class ArchipelagoService {
  constructor() {
    this.client = markRaw(new Client())

    // --- Reactive State ---
    // These refs are the single source of truth for all components.
    // They are updated by AP client events and can be imported directly.
    this.hintsRef = ref([])
    this.itemsAllRef = ref([])
    this.itemsUniqueRef = ref([])
    this.locationsRef = ref({})
    this.shapesanityRef = shallowRef([])
    this.messagesRef = ref([])

    // Non-reactive internal cache
    this.slotData = null;
    this.shapesanityCache = {};

    // --- Event Wiring ---

    // Messages: connected
    this.client.messages.on('connected', (text, player, tags, nodes) => {
      console.log('🔌' + text);
      this.messagesRef.value = [...this.messagesRef.value, {
        type: 'connected',
        text,
        player: { name: player.name, slot: player.slot, game: player.game },
        nodes
      }];
    });

    // Messages: catch-all for non-connected messages
    this.client.messages.on('itemSent', (text, item, nodes) => {
      this._pushMessage({ type: 'itemSent', text, nodes });
    });
    this.client.messages.on('itemCheated', (text, item, nodes) => {
      this._pushMessage({ type: 'itemCheated', text, nodes });
    });
    this.client.messages.on('itemHinted', (text, item, found, nodes) => {
      this._pushMessage({ type: 'itemHinted', text, nodes });
    });
    this.client.messages.on('disconnected', (text, player, nodes) => {
      this._pushMessage({
        type: 'disconnected',
        text,
        player: { name: player.name, slot: player.slot, game: player.game },
        nodes
      });
    });
    this.client.messages.on('chat', (message, player, nodes) => {
      this._pushMessage({
        type: 'chat',
        text: `<${player.name}> ${message}`,
        player: { name: player.name, slot: player.slot, game: player.game },
        nodes
      });
    });
    this.client.messages.on('serverChat', (message, nodes) => {
      this._pushMessage({ type: 'serverChat', text: message, nodes });
    });
    this.client.messages.on('goaled', (text, player, nodes) => {
      this._pushMessage({
        type: 'goaled',
        text,
        player: { name: player.name, slot: player.slot, game: player.game },
        nodes
      });
    });
    this.client.messages.on('released', (text, player, nodes) => {
      this._pushMessage({
        type: 'released',
        text,
        player: { name: player.name, slot: player.slot, game: player.game },
        nodes
      });
    });
    this.client.messages.on('collected', (text, player, nodes) => {
      this._pushMessage({
        type: 'collected',
        text,
        player: { name: player.name, slot: player.slot, game: player.game },
        nodes
      });
    });
    this.client.messages.on('countdown', (text, value, nodes) => {
      this._pushMessage({ type: 'countdown', text, nodes });
    });
    this.client.messages.on('userCommand', (text, nodes) => {
      this._pushMessage({ type: 'userCommand', text, nodes });
    });
    this.client.messages.on('adminCommand', (text, nodes) => {
      this._pushMessage({ type: 'adminCommand', text, nodes });
    });

    // --- HINTS ---
    this.client.items.on('hintsInitialized', (hints) => {
      console.log('Hints initialized:', hints);
      this.hintsRef.value = markRaw(hints);
      this._refreshShapesanityHintsAndLocations();
    });

    this.client.items.on('hintReceived', (hint) => {
      console.log('❔', hint);
      const exists = this.hintsRef.value.some(h =>
        h.item.locationName === hint.item.locationName &&
        h.item.name === hint.item.name &&
        h.item.receiver.slot === hint.item.receiver.slot
      );
      if (!exists) {
        this.hintsRef.value = [...this.hintsRef.value, hint];
        this._refreshShapesanityHintsAndLocations();
      }
    });

    this.client.items.on('hintFound', (hint) => {
      console.log('❓', hint);
      // The hint from hintFound already has found=true.
      // Match by location + item + receiver since Hint uses private fields
      // and can't be spread.
      const index = this.hintsRef.value.findIndex(h =>
        h.item.locationName === hint.item.locationName &&
        h.item.name === hint.item.name &&
        h.item.receiver.slot === hint.item.receiver.slot
      );
      if (index !== -1) {
        // Replace with the new Hint object (which has found=true)
        const updated = [...this.hintsRef.value];
        updated[index] = hint;
        this.hintsRef.value = updated;
        this._refreshShapesanityHintsAndLocations();
      }
    });

    // --- ITEMS RECEIVED ---
    this.client.items.on('itemsReceived', (items, startingIndex) => {
      console.log('📦 Items received:', items.map(i => i.name));
      this._refreshItems();
      this._refreshShapesanityHintsAndLocations();
    });

    // --- LOCATIONS CHECKED ---
    this.client.room.on('locationsChecked', (locations) => {
      console.log('📍 Locations checked:', locations);
      this._refreshLocations();
      this._refreshShapesanityHintsAndLocations();
    });
  }

  _pushMessage(msg) {
    this.messagesRef.value = [...this.messagesRef.value, msg];
  }

  _refreshItems() {
    this.itemsAllRef.value = this.client.items.received.map(i => i.name);
    this.itemsUniqueRef.value = [...new Set(this.itemsAllRef.value)];
  }

  _refreshLocations() {
    const sentLocations = this.client.room.checkedLocations;
    const newLocs = {};
    sentLocations.forEach(loc => {
      newLocs[loc] = this.client.package.lookupLocationName("shapez", loc);
    });
    this.locationsRef.value = newLocs;
  }

  /**
   * Re-derive hint/found/logic status on each shapesanity entry
   * without regenerating images or re-parsing shape codes.
   */
  _refreshShapesanityHintsAndLocations() {
    const current = this.shapesanityRef.value;
    if (!current || current.length === 0) return;

    const updated = current.map(entry => ({
      ...entry,
      hint: this.isHintedByLocationName(entry.location),
      found: this.isLocationSentByName(entry.location),
      logic: assignShapeLogic(entry.shape, entry.name),
    }));
    this.shapesanityRef.value = updated;
  }

  async connect(address, slot, password, game) {
    this.slotData = await this.client.login(address, slot, game, { password })

    // Initial data load into reactive refs
    this._refreshItems();
    this._refreshLocations();
    this._buildShapesanity();

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
    return this.hintsRef.value.map(h => ({
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
    }));
  }

  // Items (kept for backward compat, but components should prefer the refs)
  getReceivedItems() {
    return this.itemsAllRef.value;
  }
  getUniqueReceivedItems() {
    return this.itemsUniqueRef.value;
  }

  // Locations
  getSentLocations() {
    return this.locationsRef.value;
  }

  isLocationSentByName(location) {
    return Object.values(this.locationsRef.value).includes(location);
  }

  isHintedByLocationName(location) {
    return this.hintsRef.value.find(h => h.item.locationName == location) || null;
  }

  // Shapesanity
  getSlotData() {
    return this.slotData;
  }
  getShapesanityRaw() {
    if (this.shapesanityCache?.raw) return this.shapesanityCache.raw;
    const shapesanityRaw = this.slotData?.shapesanity;
    this.shapesanityCache.raw = shapesanityRaw;
    return shapesanityRaw;
  }
  getShapesanityCodes() {
    if (this.shapesanityCache?.codes) return this.shapesanityCache.codes;
    const raw = this.getShapesanityRaw();
    if (!raw) return null;

    const codes = shapesanityArrayToCodes(raw);
    this.shapesanityCache.codes = codes;
    return codes;
  }

  /**
   * Builds the full shapesanity array once (images are expensive).
   * After this, _refreshShapesanityHintsAndLocations() cheaply
   * updates hint/found/logic on each entry.
   */
  _buildShapesanity() {
    const raw = this.getShapesanityRaw();
    const codes = this.getShapesanityCodes();
    if (!codes || !raw) return null;

    let parsed = [];
    raw.forEach((name, index) => {
      const shapeCode = codes[name];
      const shape = fromShortKey(shapeCode);
      parsed.push({
        code: shapeCode,
        name,
        location: `Shapesanity ${index + 1}`,
        shape,
        image: renderShape(shapeCode),
        hint: this.isHintedByLocationName(`Shapesanity ${index + 1}`),
        found: this.isLocationSentByName(`Shapesanity ${index + 1}`),
        logic: assignShapeLogic(shape, name),
      });
    });
    this.shapesanityRef.value = parsed;
    return parsed;
  }

  getShapesanityParsed() {
    return this.shapesanityRef.value;
  }
  // Shapesanity Alias
  getShapesanity() { return this.getShapesanityParsed(); }
}

export const apService = new ArchipelagoService()

// Exported reactive refs for typed components
export const itemsAllRef = apService.itemsAllRef;
export const itemsUniqueRef = apService.itemsUniqueRef;
export const hintsRef = apService.hintsRef;
export const locationsRef = apService.locationsRef;
export const shapesanityRef = apService.shapesanityRef;
export const messagesRef = apService.messagesRef;

// backport function, will be replaced
export function isBuildingAvailable(name) {
  if (!name) return true; // if no name provided, assume available
  if (!apService.getSlotData()) return true; // if not connected, assume all are available

  const items = apService.itemsAllRef.value;
  return items.includes(name);
}

class Logic {
  constructor() {
    this.items = apService.itemsUniqueRef.value;
  }

  static count(item) {
    return apService.itemsAllRef.value.filter(i => i === item).length;
  }

  static has(item) {
    return apService.itemsUniqueRef.value.includes(item);
  }

  static hasAny(items) {
    return items.some(item => apService.itemsUniqueRef.value.includes(item));
  }

  static hasAll(items) {
    return items.every(item => apService.itemsUniqueRef.value.includes(item));
  }

  static canCutHalf() {
    return this.has('Cutter');
  }

  static canRotate90() {
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

  static canMakeStitchedShape(floating) {
    return this.canStack() && ((this.has('Quad Cutter') && !floating) || (this.canCutHalf() && this.canRotate90()));
  }

  static canBuildMAM(floating) {
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

  static canMakeHalfShape() {
    // Only used for shapesanity => single layers
    return this.canCutHalf() || this.hasAll(['Quad Cutter', 'Stacker']);
  }

  static hasXbeltMultiplier(needed) {
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

  let floating = Logic.hasFloatingCorner(shape);

  // Check for Color Logic
  if (shape.some(layer => layer.some(corner => corner && corner.color != 'uncolored'))) {
    logic.push("canPaint");
  }

  // Check for Mixed Colors Logic
  const mixedColors = ["cyan", "magenta", "yellow", "white"];
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
