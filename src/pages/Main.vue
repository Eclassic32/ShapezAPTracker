<script setup>
import TopBar from '@/components/TopBar.vue';
import router from '@/router/router';
import { apService } from '@/utils/archipelago-helper';
import { ref, provide, onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router';

router.push('/');

// Reactive data
const isConnected = ref(false);
const address = ref(localStorage.getItem('ap-address') || '');
const slotName = ref(localStorage.getItem('ap-slotName') || '');
const password = ref(localStorage.getItem('ap-password') || '');

provide('isConnected', isConnected);

async function connectToServer({ address: addr, slotName: slot, password: pass }) {
  address.value = addr;
  slotName.value = slot;
  password.value = pass;

  // debug
  window.apService = apService;

  console.log('Connecting to server...');
  
  try {
    await apService.connect(address.value, slotName.value, password.value);
  
    console.log(apService); // Debug
    
    localStorage.setItem('ap-address', address.value);
    localStorage.setItem('ap-slotName', slotName.value);
    localStorage.setItem('ap-password', password.value);
  
    isConnected.value = true;
  
    console.log("Slot Data: ", apService.slotData);
    

    router.push('/templates');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

// Cleanup on unmount
onBeforeUnmount(() => {
  if (apService) {
    apService.disconnect();
  }
  isConnected.value = false;
});
</script>

<template>
  <div class="main-page">
    
    <TopBar v-if="isConnected" :isConnected="isConnected" :slotName="slotName" />
    <RouterView @connect="connectToServer" />

  </div>
</template>

<style scoped>
/* --- Main --- */
.main-page {
  /* min-height: 100vh; */
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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


/* --- Tracker Section --- */
.tracker-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  width: 100%;
}



</style>
