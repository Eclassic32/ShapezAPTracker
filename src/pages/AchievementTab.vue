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
            :src="iconUrl(isAchievementInLogic(achievement) ? achievement.icon : achievement.icon_gray)"
            :alt="achievement.name"
            loading="lazy"
          />
          <img
            v-if="isChecked(achievement.name)"
            class="achievement-check"
            src="/assets/check.png"
            alt="Collected"
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
  receivedItems,
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
  logic?: string[];
}

interface AchievementsFile {
  achievements: AchievementEntry[];
}

const IMAGE_BASE =
  "https://shared.fastly.steamstatic.com/community_assets/images/apps/1318690/";

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

function getItemsAll() {
  return receivedItems.map((item) => item.name);
}

function getItemsUnique() {
  return [...new Set(getItemsAll())];
}

class AchievementLogic {
  static count(item: string): number {
    return getItemsAll().filter((i) => i === item).length;
  }

  static has(item: string): boolean {
    return getItemsUnique().includes(item);
  }

  static hasAny(items: string[]): boolean {
    const unique = getItemsUnique();
    return items.some((item) => unique.includes(item));
  }

  static hasAll(items: string[]): boolean {
    const unique = getItemsUnique();
    return items.every((item) => unique.includes(item));
  }

  static canCutHalf(): boolean {
    return this.has("Cutter");
  }

  static canRotateCW(): boolean {
    return this.has("Rotator");
  }

  static canRotate90(): boolean {
    return this.hasAny(["Rotator", "Rotator (CCW)"]);
  }

  static canRotate180(): boolean {
    return this.hasAny(["Rotator", "Rotator (180°)", "Rotator (CCW)"]);
  }

  static canStack(): boolean {
    return this.has("Stacker");
  }

  static canPaint(): boolean {
    return (
      this.hasAny(["Painter", "Double Painter"]) || this.canUseQuadPainter()
    );
  }

  static canMixColors(): boolean {
    return this.has("Color Mixer");
  }

  static hasTunnel(): boolean {
    return this.hasAny(["Tunnel", "Tunnel Tier II"]);
  }

  static hasBalancer(): boolean {
    return (
      this.has("Balancer") ||
      this.hasAll(["Compact Merger", "Compact Splitter"])
    );
  }

  static canUseQuadPainter(): boolean {
    return (
      this.hasAll(["Quad Painter", "Wire"]) &&
      this.hasAny(["Switch", "Constant Signal"])
    );
  }

  static canMakeStitchedShape(floating: boolean): boolean {
    return (
      this.canStack() &&
      ((this.has("Quad Cutter") && !floating) ||
        (this.canCutHalf() && this.canRotate90()))
    );
  }

  static canBuildMAM(): boolean {
    return (
      this.canMakeStitchedShape(true) &&
      this.canPaint() &&
      this.canMixColors() &&
      this.hasBalancer() &&
      this.hasTunnel()
    );
  }
}

function parseLogicArgs(rawArgs: string): unknown[] {
  const trimmed = rawArgs.trim();
  if (!trimmed) return [];

  return trimmed.split(",").map((part) => {
    const value = part.trim();
    if (value === "true") return true;
    if (value === "false") return false;
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    return value;
  });
}

function evaluateLogicExpression(expression: string): boolean {
  const trimmed = expression.trim();
  if (!trimmed) return true;

  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?$/);
  if (!match) return true;

  const [, methodName, rawArgs] = match;
  const logicObject = AchievementLogic as unknown as Record<string, (...args: unknown[]) => boolean>;
  const method = logicObject[methodName];
  if (typeof method !== "function") return true;

  const args = rawArgs === undefined ? [] : parseLogicArgs(rawArgs);
  return method.apply(AchievementLogic, args);
}

function isAchievementInLogic(achievement: AchievementEntry): boolean {
  const logic = achievement.logic;
  if (!logic || logic.length === 0) return true;
  return logic.every((entry) => evaluateLogicExpression(entry));
}

async function loadAchievementsOnce(): Promise<AchievementEntry[]> {
  if (cachedAchievements) return cachedAchievements;
  if (achievementsLoadPromise) return achievementsLoadPromise;

  achievementsLoadPromise = fetch("/assets/Achievements.json")
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
  achievements.value = await loadAchievementsOnce();
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

.achievement-check {
  position: absolute;
  inset: 0;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  pointer-events: none;
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
