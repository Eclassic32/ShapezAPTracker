<template>
  <div class="achievements-tab">
    <div
      v-for="group in groupedAchievements"
      :key="group.type"
      class="achievement-group"
    >
      <h3 class="group-title">{{ formatType(group.type) }}</h3>
      <div class="group-row">
        <button
          v-for="achievement in group.entries"
          :key="achievement.id"
          class="achievement-icon-btn"
          type="button"
          @mouseenter="handleEnter($event, achievement)"
          @mouseleave="handleLeave"
        >
          <img
            class="achievement-icon"
            :src="iconUrl(isChecked(achievement.name) ? achievement.icon : achievement.icon_gray)"
            :alt="achievement.name"
            loading="lazy"
          />
        </button>
      </div>
    </div>

    <div
      v-if="openAchievement"
      ref="floating"
      class="achievement-tooltip"
      :style="floatingStyles"
    >
      <div class="tooltip-name">{{ openAchievement.name }}</div>
      <div class="tooltip-desc">{{ openAchievement.desc }}</div>
    </div>

    <div
        v-if="groupedAchievements.length == 0"
    >
      <h3 class="group-title">No achievements available.</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { flip, offset, shift, useFloating } from "@floating-ui/vue";
import {
  checkedLocations,
  client,
  gameName,
  missingLocations,
} from "@/stores/archipelago";

interface AchievementEntry {
  id: string;
  name: string;
  desc: string;
  icon: string;
  icon_gray: string;
  type: string;
  restriction: string;
}

interface AchievementsFile {
  achievements: AchievementEntry[];
}

const IMAGE_BASE =
  "https://shared.fastly.steamstatic.com/community_assets/images/apps/1318690/";

const achievements = ref<AchievementEntry[]>([]);
const openAchievement = ref<AchievementEntry | null>(null);
const reference = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);

const { floatingStyles } = useFloating(reference, floating, {
  placement: "top",
  middleware: [offset(10), flip(), shift({ padding: 8 })],
});

const checkedLocationNames = computed(() => {
  const names = new Set<string>();
  const c = client.value;
  if (!c || !gameName.value) return names;

  for (const locationId of checkedLocations) {
    names.add(c.package.lookupLocationName(gameName.value, locationId, true));
  }

  return names;
});

const allLocationNames = computed(() => {
  const names = new Set<string>();
  const c = client.value;
  if (!c || !gameName.value) return names;

  for (const locationId of checkedLocations) {
    names.add(c.package.lookupLocationName(gameName.value, locationId, true));
  }
  for (const locationId of missingLocations) {
    names.add(c.package.lookupLocationName(gameName.value, locationId, true));
  }

  return names;
});

const restrictedGroupAllowed = computed(() => {
  const allowedByRestriction = new Map<string, boolean>();

  if (allLocationNames.value.size === 0) {
    return allowedByRestriction;
  }

  for (const achievement of achievements.value) {
    if (!achievement.restriction) continue;
    if (allowedByRestriction.has(achievement.restriction)) continue;

    const isAvailable = allLocationNames.value.has(achievement.name);
    allowedByRestriction.set(achievement.restriction, isAvailable);
  }

  return allowedByRestriction;
});

const visibleAchievements = computed(() => {
  return achievements.value.filter((achievement) => {
    if (!achievement.restriction) return true;
    if (allLocationNames.value.size === 0) return true;
    return restrictedGroupAllowed.value.get(achievement.restriction) === true;
  });
});

const groupedAchievements = computed(() => {
  const groups = new Map<string, AchievementEntry[]>();

  for (const achievement of visibleAchievements.value) {
    const current = groups.get(achievement.type);
    if (current) {
      current.push(achievement);
      continue;
    }
    groups.set(achievement.type, [achievement]);
  }

  return Array.from(groups.entries()).map(([type, entries]) => ({
    type,
    entries,
  }));
});

function iconUrl(fileName: string) {
  return `${IMAGE_BASE}${fileName}`;
}

function isChecked(locationName: string) {
  return checkedLocationNames.value.has(locationName);
}

function handleEnter(event: MouseEvent, achievement: AchievementEntry) {
  reference.value = event.currentTarget as HTMLElement;
  openAchievement.value = achievement;
}

function handleLeave() {
  openAchievement.value = null;
}

function formatType(type: string) {
  if (!type) return "Other";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

onMounted(async () => {
  try {
    const response = await fetch("/assets/Achievements.json");
    if (!response.ok) {
      achievements.value = [];
      return;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      achievements.value = [];
      return;
    }

    const data = (await response.json()) as AchievementsFile;
    achievements.value = data.achievements ?? [];
  } catch {
    achievements.value = [];
  }
});
</script>

<style scoped>
.achievements-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: auto;
}

.achievement-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.group-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.group-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.achievement-icon-btn {
  border: 1px solid transparent;
  padding: 0;
  border-radius: 6px;
  background: transparent;
  line-height: 0;
  flex: 0 0 auto;
}

.achievement-icon-btn:hover {
  border-color: var(--accent);
  background: transparent;
}

.achievement-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  display: block;
}

.achievement-tooltip {
  position: absolute;
  max-width: 260px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  padding: 10px 12px;
  z-index: 20;
}

.tooltip-name {
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.tooltip-desc {
  color: var(--text-secondary);
  font-size: 0.85rem;
}
</style>
