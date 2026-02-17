import { Client } from "archipelago.js"
import { markRaw } from "vue"

class ArchipelagoService {
  constructor() {
    this.client = markRaw(new Client())
    this.hints = markRaw([])

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
      this.hints.push(hint);
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
    return this.client.login(address, slot, game, { password })
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
}

export const apService = new ArchipelagoService()


// backport function, will be replaced
export function isBuildingAvailable(name) {
  return name != "Lever_on";
  
}
