<template>
  <div class="main-page" :class="{ fullscreen: !isConnected }">
    <!-- Connection Section -->
    <div v-if="!isConnected" class="connection-section">
      
      <div id="ap-connect">
        <h1>Shapez AP Tracker</h1>
        <input type="text" v-model="address" placeholder="Server Address">
        <input type="text" v-model="slotName" placeholder="Slot Name">
        <input type="password" v-model="password" placeholder="Password">
        <button @click="connectToServer" :disabled="isConnected">
          {{ isConnected ? 'Connected' : 'Connect' }}
        </button>
        <p v-if="isConnected" class="status-connected">Connected as {{ slotName }}</p>
      </div>


      <div class="tilemaps">
        <a href="viewer.html" class="tilemap-link">
          <div class="tilemap-card">
            <h2>Tile Viewer</h2>
            <p>View saved tile maps</p>
          </div>
        </a>
        <a href="editor.html" class="tilemap-link">
          <div class="tilemap-card">
            <h2>Tile Editor</h2>
            <p>Create and edit tile maps</p>
          </div>
        </a>
      </div>
    </div>

    <!-- Tracker Section -->
    <div v-else class="tracker-section">
      <TopBar :isConnected="isConnected" :slotName="slotName" />
      <TextClientTab :apService="apService"/>

    </div>
  </div>
</template>

<script>
import TextClientTab from '@/components/TextClientTab.vue';
import TopBar from '@/components/TopBar.vue';
import { apService } from '@/utils/archipelago-helper';
import { markRaw, toRaw } from 'vue'

export default {
  name: 'MainPage',
  data() {
    return {
      address: localStorage.getItem('ap-address') || '',
      slotName: localStorage.getItem('ap-slotName') || '',
      password: localStorage.getItem('ap-password') || '',
      
      apService: null,
      isConnected: false,

      player: null,
      hints: [],
      items: [],
      locations: []

    };
  },
  components: {
    TopBar,
    TextClientTab
  },

  methods: {
    connectToServer() {
      console.log('Connecting to server...');
      
      this.apService = apService;
      this.apService.connect(this.address, this.slotName, this.password);

      // Let it load after connection
      setTimeout(() => {
        this.player = this.apService.getThisPlayer();
        this.hints = this.apService.getHints();
        // this.items = this.apService.getItems();
        // this.locations = this.apService.getLocations();
        this.isConnected = true;
      }, 1000);
    }
  },

  beforeUnmount() {
    // Clean up client connection when component is destroyed
    if (this.apService) {
      this.apService.disconnect();
    }
    this.isConnected = false;
  }
};
</script>

<style scoped>
/* --- Main --- */
.main-page {
  /* min-height: 100vh; */
  display: flex;
}

button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #4CAF50;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  background: #45a049;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fullscreen {
  width: 100%;
  height: 100vh;
}

/* --- Connection Section --- */
.connection-section {
  display: flex;
  flex-direction: row;
  gap: 4rem;
  align-items: center;
  text-align: center;
  max-width: 800px;
  width: 100%;
}

h1 {
  font-size: 3rem;
  margin-bottom: 3rem;
  color: #fff;
}

.tilemaps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.tilemap-link {
  text-decoration: none;
  flex: 1;
  min-width: 250px;
}

.tilemap-card {
  background: var(--container-bg);
  border: 2px solid var(--container-border);
  border-radius: 8px;
  padding: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tilemap-card:hover {
  border-color: #4CAF50;
  background: #222;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(76, 175, 80, 0.2);
}

.tilemap-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #4CAF50;
}

.tilemap-card p {
  color: #999;
  font-size: 0.9rem;
}

#ap-connect {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

input[type="text"] {
  padding: 0.75rem;
  border: 2px solid #333;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
}

input[type="password"] {
  padding: 0.75rem;
  border: 2px solid #333;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
}

.status-connected {
  color: #4CAF50;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* --- Tracker Section --- */
.tracker-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  width: 100%;
}



</style>