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
          @mouseenter="handleMouseEnter($event, achievement)"
          @mouseleave="handleMouseLeave"
        >
          <img
            class="achievement-icon"
            :src="'https://shared.fastly.steamstatic.com/community_assets/images/apps/1318690/'
                        + (isAchievementInLogic(achievement.logic) 
                          || settings.achievements.allwaysUseColoredIcons 
                           ? achievement.icon : achievement.icon_gray)"
            :alt="achievement.name"
            loading="lazy"
          />
          <!-- <img
            class="achievement-border-base"
            :src="whiteBorderUrl"
            alt=""
            aria-hidden="true"
            loading="lazy"
          /> -->
          <span
            v-if="getAchievementState(achievement)"
            class="achievement-border-tint"
            :style="`background-color: var(--color-${getAchievementState(achievement)})`"
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
      <div v-if="settings.debug" class="tooltip-logic">Logic: {{ openAchievement.logic }}</div>
      <div v-if="settings.debug" class="tooltip-type">Type: {{ openAchievement.type }}</div>
      <div v-if="settings.debug" class="tooltip-restriction">Restriction: {{ openAchievement.restriction }}</div>
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
import { settings } from "@/stores/settings";
import { isAchievementInLogic} from "@/utils/achievements-logic";
import { checkedLocations, client, gameName, hints, missingLocations } from "@/stores/archipelago";

interface AchievementEntry {
  id: string;
  name: string;
  desc: string;
  icon: string;
  icon_gray: string;
  type: string;
  restriction: string;
  logic?: string[];
}

interface AchievementsFile {
  achievements: AchievementEntry[];
}

const borderMaskImage = `url(${import.meta.env.BASE_URL}AchievementBorder.png)`;

let cachedAchievements: AchievementEntry[] | null = null;
let achievementsLoadPromise: Promise<AchievementEntry[]> | null = null;

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


async function loadAchievements(): Promise<AchievementEntry[]> {
  if (cachedAchievements) return cachedAchievements;
  if (achievementsLoadPromise) return achievementsLoadPromise;

  achievementsLoadPromise = fetch(`${import.meta.env.BASE_URL}assets/Achievements.json`)
    .then(async (response) => {
      if (!response.ok) return [];
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) return [];
      const data = (await response.json()) as AchievementsFile;
      return data.achievements ?? [];
    })
    .catch(() => [])
    .then((loaded) => {
      cachedAchievements = loaded;
      return loaded;
    });

  return achievementsLoadPromise;
}

function getAchievementState(achievement: AchievementEntry): "found" | "out-of-logic" | "hinted" | "in-logic" | ''{
  if (checkedLocationNames.value.has(achievement.name)) return "found";
  if (!isAchievementInLogic(achievement.logic)) return "out-of-logic";
  if (hints.some((hint) => hint.location === (achievement.name))) return "hinted";
  if (isAchievementInLogic(achievement.logic) && settings.colors.inLogic !== "none") return "in-logic";
  return "";
}

function handleMouseEnter(event: MouseEvent, achievement: AchievementEntry) {
  reference.value = event.currentTarget as HTMLElement;
  openAchievement.value = achievement;
}

function handleMouseLeave() {
  openAchievement.value = null;
}

function formatType(type: string) {
  if (!type) return "Other";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

onMounted(async () => {
  achievements.value = await loadAchievements();
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
  border: 2px solid transparent;
  padding: 0;
  border-radius: 16%;
  background: transparent;
  line-height: 0;
  flex: 0 0 auto;
  position: relative;
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

.achievement-border-base {
  position: absolute;
  inset: 0;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  pointer-events: none;
}

.achievement-border-tint {
  position: absolute;
  inset: 0;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  pointer-events: none;
  mask-image: v-bind(borderMaskImage);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-image: v-bind(borderMaskImage);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
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
