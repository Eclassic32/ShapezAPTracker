<!--
  SettingsPage.vue — User preferences page.

  Provides controls for theme switching, AP color customization, and
  message type filtering. All changes are persisted to localStorage
  automatically via the settings store.
-->
<template>
  <div class="settings-page">
    <h2>Settings</h2>

    <!-- Tile Map Tools -->
    <section class="settings-section">
      <h3>Tile Map Tools</h3>
      <div class="tilemap-links">
        <a href="viewer.html" target="_blank" class="tilemap-link">
          <div class="tilemap-card">
            <h4>Tile Viewer</h4>
            <p>View saved tile maps</p>
          </div>
        </a>
        <a href="editor.html" target="_blank" class="tilemap-link">
          <div class="tilemap-card">
            <h4>Tile Editor</h4>
            <p>Create and edit tile maps</p>
          </div>
        </a>
      </div>
    </section>

    <section class="settings-section">
      <h3>Achievement Options</h3>
      <div class="achievement-options">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="settings.achievements.allwaysUseColoredIcons"
            @change="settings.achievements.allwaysUseColoredIcons = ($event.target as HTMLInputElement).checked"
          />
          Always use colored icons for achievements
        </label>
      </div>
    </section>

    <!-- === Template Options === -->
    <!-- Theme -->
    <section class="settings-section">
      <h3>Theme</h3>
      <div class="theme-toggle">
        <button
          :class="{ active: settings.theme === 'dark' }"
          @click="settings.theme = 'dark'"
        >
          Dark
        </button>
        <button
          :class="{ active: settings.theme === 'light' }"
          @click="settings.theme = 'light'"
        >
          Light
        </button>
      </div>
    </section>

    <!-- Color Customization -->
    <section class="settings-section">
      <h3>Item Colors</h3>
      <div class="color-grid">
        <ColorPicker label="Progression" v-model="settings.colors.progression" />
        <ColorPicker label="Useful" v-model="settings.colors.useful" />
        <ColorPicker label="Filler / Normal" v-model="settings.colors.filler" />
        <ColorPicker label="Trap" v-model="settings.colors.trap" />
      </div>
    </section>

    <section class="settings-section">
      <h3>Player & Location Colors</h3>
      <div class="color-grid">
        <ColorPicker label="Other Player" v-model="settings.colors.player" />
        <ColorPicker label="Current Player" v-model="settings.colors.playerSelf" />
        <ColorPicker label="Location" v-model="settings.colors.location" />
        <ColorPicker label="Entrance" v-model="settings.colors.entrance" />
      </div>
    </section>

    <section class="settings-section">
      <h3>Tracker Colors</h3>
      <div class="color-grid">
        <ColorPicker label="Found" v-model="settings.colors.found" />
        <ColorPicker label="Hinted" v-model="settings.colors.hinted" />
        <ColorPicker label="Hard Logic" v-model="settings.colors.hardLogic" />
        <ColorPicker label="Out of Logic" v-model="settings.colors.outOfLogic" />
      </div>
    </section>

    <!-- Message Filters -->
    <section class="settings-section">
      <h3>Message Filters</h3>
      <p class="filter-description">Choose which message types appear in the Text Client.</p>
      <div class="filter-grid">
        <label
          v-for="msgType in ALL_MESSAGE_TYPES"
          :key="msgType"
          class="filter-label"
        >
          <input
            type="checkbox"
            :checked="settings.messageFilters[msgType]"
            @change="settings.messageFilters[msgType] = ($event.target as HTMLInputElement).checked"
          />
          {{ MESSAGE_TYPE_LABELS[msgType] }}
        </label>
      </div>
    </section>
    
    <section class="settings-section">
      <div class="reset-buttons">
        <button class="filter-reset" @click="resetMessageFilters">Reset Filters</button>
        <button @click="resetColors">Reset Colors</button>
        <button class="danger" @click="resetAllSettings">Reset All Settings</button>
      </div>
    </section>

    
  </div>
</template>

<script setup lang="ts">
import { settings, resetColors, resetAllSettings, resetMessageFilters } from "@/stores/settings";
import { ALL_MESSAGE_TYPES, MESSAGE_TYPE_LABELS } from "@/stores/archipelago";
import ColorPicker from "@/components/ColorPicker.vue";
</script>

<style scoped>
.settings-page {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

h2 {
  font-size: 1.3rem;
  margin-bottom: 20px;
}

.settings-section {
  margin-bottom: 28px;
}

.settings-section h3 {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 6px;
}

/* Theme toggle */
.theme-toggle {
  display: flex;
  gap: 8px;
}
.theme-toggle button {
  min-width: 80px;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
.theme-toggle button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* Color grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* Reset */
.reset-buttons {
  display: flex;
  gap: 12px;
}

/* Message filters */
.filter-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px 16px;
  margin-bottom: 12px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
}

.filter-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.filter-reset {
  font-size: 0.85rem;
}

/* Tilemap links */
.tilemap-links {
  display: flex;
  gap: 1rem;
}

.tilemap-link {
  text-decoration: none;
  color: inherit;
}

.tilemap-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px 24px;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.tilemap-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tilemap-card h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.tilemap-card p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
