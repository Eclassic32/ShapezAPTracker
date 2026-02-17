<template>
    <nav>
        <div class="container">
            <router-link to="templates" class="nav-link">Templates</router-link>
            <router-link to="shapesanity" class="nav-link">Shapesanity</router-link>
            <router-link to="achievements" class="nav-link">Achievements</router-link>
            <router-link to="textclient" class="nav-link">Text Client</router-link>
            <router-link to="settings" class="nav-link">Settings</router-link>

            <!-- <a href="#templates" class="nav-link" :class="{ selected: currentTab === 'templates' }">Templates</a>
            <a href="#shapesanity" class="nav-link" :class="{ selected: currentTab === 'shapesanity' }">Shapesanity</a>
            <a href="#achievements" class="nav-link" :class="{ selected: currentTab === 'achievements' }">Achievements</a>
            <a href="#texthints" class="nav-link" :class="{ selected: currentTab === 'texthints' }">Text & Hints</a> -->
        </div>

        <div v-if="isConnected" class="container connection-text">
            <span :class="isConnected? 'green-text' : 'red-text'">
                Connected as: 
                {{ slotName || 'Unknown Slot' }}
            </span>
        </div>
    </nav>
</template>

<script>
export default {
  name: 'TopBar',
    components: {
    },

  props: {
    isConnected: {
      type: Boolean,
      required: true
    },
    slotName: {
      type: String,
      required: true
    },
  }
};

</script>
<style>
nav {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    width: 100%;
    padding: 1rem 0;
    overflow: hidden;

    border-bottom: 3px solid var(--container-border);
    background-color: var(--container-bg);
}
nav a {
    text-decoration: none;
    color: var(--text-color);
    font-weight: bold;
}

nav a.router-link-active {
    color: var(--link-selected);
}

.green-text {
    color: #4CAF50;
}

.red-text {
    color: #f44336;
}

.container {
    display: flex;
    flex-direction: row;
    gap: 2rem;
    padding: 0 1rem;
}
</style>
