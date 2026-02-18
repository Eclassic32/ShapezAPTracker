// @ts-nocheck

import { Client } from "archipelago.js"
import { markRaw } from "vue"
import { shapesanityArrayToCodes } from "./shapesanity";
import { fromShortKey, renderShape } from "./shape-generator";

class ArchipelagoService {
  constructor() {
    this.client = markRaw(new Client())
    this.hints = markRaw([])
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
        image: renderShape(codes[name])
      });
    });
    this.shapesanity.parsed = parsed;
    return this.shapesanity.parsed;
  }

  // Shapesanity Alias
  getShapesanity () { return this.getShapesanityParsed(); }

  getReceivedItems() {
    this.receivedItems = this.client.items.received.map(i => i.name);
    return this.receivedItems;
  }
}

export const apService = new ArchipelagoService()

// backport function, will be replaced
export function isBuildingAvailable(name) {
  const items = apService.getReceivedItems();
  return items.includes(name);
  
}
