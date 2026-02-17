<script setup>
import { inject } from 'vue';

let isConnected = inject('isConnected');
</script>

<template>
    <div class="connection-section">
      
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
</template>

<script>
export default {
    name: 'ConnectionTab',
    data() {
        return {
            address: localStorage.getItem('ap-address') || '',
            slotName: localStorage.getItem('ap-slotName') || '',
            password: localStorage.getItem('ap-password') || '',
        };
    },
    methods: {
        connectToServer() {
            this.$emit('connect', {
                address: this.address,
                slotName: this.slotName,
                password: this.password
            });
        }
    }
};

</script>

<style>

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
</style>