<template>
  <div class="main-page">
    <div class="container">
      
      <div id="ap-connect">
        <h1>Shapez AP Tracker</h1>
        <input type="text" id="ap-connect-address" placeholder="Server Address">
        <input type="text" id="ap-connect-slotname" placeholder="Slot Name">
        <input type="text" id="ap-connect-password" placeholder="Password">
        <button @click="connectToServer">Connect</button>
      </div>


      <nav class="navigation">
        <a href="viewer.html" class="nav-link">
          <div class="nav-card">
            <h2>Tile Viewer</h2>
            <p>View saved tile maps</p>
          </div>
        </a>
        <a href="editor.html" class="nav-link">
          <div class="nav-card">
            <h2>Tile Editor</h2>
            <p>Create and edit tile maps</p>
          </div>
        </a>
      </nav>
    </div>
  </div>
</template>

<script>
import { Client } from 'archipelago.js';

export default {
  name: 'MainPage',
  props: {
    isConnected: { type: Boolean, default: false },
    address: { type: String, default: '' },
    slotName: { type: String, default: '' },
    password: { type: String, default: '' },

    apClient: { type: Object, default: () => ({}) }
  },
  methods: {
    connectToServer() {
      this.address = document.getElementById('ap-connect-address').value;
      this.slotName = document.getElementById('ap-connect-slotname').value;
      this.password = document.getElementById('ap-connect-password').value;


      console.log('Connecting to server...');
      
      const apClient = new Client();
      this.apClient = apClient;

      apClient.messages.on('message', (message) => {
        console.log('Received message:', message);
      });

      apClient.connect(this.address, this.slotName, { password: this.password })
        .then(() => {
          console.log('Connected to server!');
          this.isConnected = true;
          apClient.sendMessage({ type: 'hello', content: 'Hello from client!' });

          console.log(apClient);
          
        })
        .catch(err => {
          console.error('Failed to connect:', err);
          alert('Failed to connect to server. Please check your details and try again.');
        });
      
    }
  }
};
</script>

<style scoped>
.main-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  display: flex;
  flex-direction: row;
  gap: 4rem;
  text-align: center;
  max-width: 800px;
  width: 100%;
}

h1 {
  font-size: 3rem;
  margin-bottom: 3rem;
  color: #fff;
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  flex: 1;
  min-width: 250px;
}

.nav-card {
  background: var(--container-bg-dark);
  border: 2px solid var(--container-border-dark);
  border-radius: 8px;
  padding: 2rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.nav-card:hover {
  border-color: #4CAF50;
  background: #222;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(76, 175, 80, 0.2);
}

.nav-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #4CAF50;
}

.nav-card p {
  color: #999;
  font-size: 0.9rem;
}

#ap-connect {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
}

input[type="text"] {
  padding: 0.75rem;
  border: 2px solid #333;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
}

</style>