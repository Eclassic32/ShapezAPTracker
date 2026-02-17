<script setup>
import AchievementTab from '@/components/AchievementTab.vue';
import ConnectionTab from '@/components/ConnectionTab.vue';
import SettingsTab from '@/components/SettingsTab.vue';
import ShapesanityTab from '@/components/ShapesanityTab.vue';
import TemplatesTab from '@/components/TemplatesTab.vue';
import TextClientTab from '@/components/TextClientTab.vue';
import TopBar from '@/components/TopBar.vue';
import router from '@/router/router';
import { apService } from '@/utils/archipelago-helper';
import { markRaw, ref, provide, toRaw, onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router';

router.push('/');

// Reactive data
const isConnected = ref(false);
const address = ref(localStorage.getItem('ap-address') || '');
const slotName = ref(localStorage.getItem('ap-slotName') || '');
const password = ref(localStorage.getItem('ap-password') || '');
const player = ref(null);
const hints = ref([]);
const items = ref([]);
const locations = ref([]);

provide('isConnected', isConnected);

function connectToServer({ address: addr, slotName: slot, password: pass }) {
  address.value = addr;
  slotName.value = slot;
  password.value = pass;

  console.log('Connecting to server...');
  
  apService.connect(address.value, slotName.value, password.value);

  // Let it load after connection
  setTimeout(() => {
    player.value = apService.getThisPlayer();
    hints.value = apService.getHints();
    // items.value = apService.getItems();
    // locations.value = apService.getLocations();
    isConnected.value = true;

    router.push('/templates');
  }, 1000);
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
    <RouterView @connect="connectToServer" :apService="apService" />

  </div>
</template>

<style scoped>
/* --- Main --- */
.main-page {
  /* min-height: 100vh; */
  display: flex;
  flex-direction: column;
  gap: 2rem;
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