/**
 * settings.ts — User Preferences Store
 *
 * Manages theme (dark/light), color customization for AP item/player/location
 * colors, and message type filters. All settings are persisted to localStorage
 * and applied as CSS custom properties on the document root.
 *
 * The settings object is Vue-reactive: any component can import it and bind
 * directly (e.g. `settings.theme`, `settings.colors.progression`).
 */
import { reactive, watch } from "vue";
import { ALL_MESSAGE_TYPES, type MessageType } from "@/stores/archipelago";

/** Color values for all AP-specific color categories. */
export interface APColors {
  progression: string;
  useful: string;
  filler: string;
  trap: string;
  player: string;
  playerSelf: string;
  location: string;
  entrance: string;
  inLogic: string;
  found: string;
  hinted: string;
  hardLogic: string;
  outOfLogic: string;
}

/** Per-message-type visibility toggles for the text client. */
export type MessageFilters = Record<MessageType, boolean>;

/** Complete settings state shape. */
export interface SettingsState {
  shapesanity: {
    useHardLogic: boolean;
    filter: {
      inLogic: boolean;
      outOfLogic: boolean;
      found: boolean;
      hinted: boolean;
      hardLogic: boolean;
    }
    sort: "default" | "state";
    sortDirection: "asc" | "desc";
    sortState: {
      inLogic: number;
      outOfLogic: number;
      found: number;
      hinted: number;
      hardLogic: number;
    }
  }
  achievements: {
    allwaysUseColoredIcons: boolean;
    useHardLogic: boolean;
  };
  debug: boolean;
  theme: "dark" | "light";
  colors: APColors;
  messageFilters: MessageFilters;
}

/** Default color palette. */
const DEFAULT_COLORS: APColors = {
  progression: "#cc88ff",
  useful: "#6699ff",
  filler: "#00eeee",
  trap: "#ee4444",
  player: "#ffee00",
  playerSelf: "#eebb00",
  location: "#00ff7f",
  entrance: "#5599ff",
  inLogic: "",
  found: "#22aa22",
  hinted: "#ffaa00",
  hardLogic: "#cc88ff",
  outOfLogic: "#ee4444",
};

/** Returns a MessageFilters object with all types enabled. */
function defaultMessageFilters(): MessageFilters {
  const filters = {} as MessageFilters;
  for (const t of ALL_MESSAGE_TYPES) {
    filters[t] = true;
  }
  return filters;
}

/** Load settings from localStorage, falling back to defaults for missing keys. */
function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem("ap-tracker-settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        achievements: {
          allwaysUseColoredIcons: parsed.achievements?.allwaysUseColoredIcons ?? false,
          useHardLogic: parsed.achievements?.useHardLogic ?? true,
        },
        shapesanity: {
          useHardLogic: false,
          // useHardLogic: parsed.shapesanity?.useHardLogic ?? true, // FIX: change this after hard logic fully implemented
          filter: {
            inLogic: parsed.shapesanity?.filter?.inLogic ?? false,
            outOfLogic: parsed.shapesanity?.filter?.outOfLogic ?? false,
            found: parsed.shapesanity?.filter?.found ?? false,
            hinted: parsed.shapesanity?.filter?.hinted ?? false,
            hardLogic: parsed.shapesanity?.filter?.hardLogic ?? false,
          },
          sort: parsed.shapesanity?.sort ?? "default",
          sortDirection: parsed.shapesanity?.sortDirection ?? "asc",
          sortState: {
            inLogic: parsed.shapesanity?.sortState?.inLogic ?? 1,
            outOfLogic: parsed.shapesanity?.sortState?.outOfLogic ?? 3,
            found: parsed.shapesanity?.sortState?.found ?? 4,
            hinted: parsed.shapesanity?.sortState?.hinted ?? 0,
            hardLogic: parsed.shapesanity?.sortState?.hardLogic ?? 2,
          }
        },
        debug: window.location.search.includes("debug") ?? false,
        theme: parsed.theme ?? "dark",
        colors: { ...DEFAULT_COLORS, ...(parsed.colors ?? {}) },
        messageFilters: { ...defaultMessageFilters(), ...(parsed.messageFilters ?? {}) },
      };
    }
  } catch {
    /* corrupted data — use defaults */
  }
  return {
    achievements: {
      allwaysUseColoredIcons: false,
      useHardLogic: true,
    },
    shapesanity: {
      useHardLogic: false,
      // useHardLogic: true, // FIX: change this after hard logic fully implemented
      filter: {
        inLogic: false,
        outOfLogic: false,
        found: false,
        hinted: false,
        hardLogic: false,
      },
      sort: "default",
      sortDirection: "asc",
      sortState: {
        inLogic: 1,
        outOfLogic: 3,
        found: 4,
        hinted: 0,
        hardLogic: 2,
      }
    },
    debug: false,
    theme: "dark",
    colors: { ...DEFAULT_COLORS },
    messageFilters: defaultMessageFilters(),
  };
}

/** Reactive settings state. Import and use directly in any component. */
export const settings = reactive<SettingsState>(loadSettings());

/** Sync CSS custom properties and theme class with the current settings. */
function applySettings() {
  const root = document.documentElement;

  if (settings.theme === "light") {
    root.classList.add("theme-light");
  } else {
    root.classList.remove("theme-light");
  }

  const colorVarMap: Record<keyof APColors, string> = {
    progression: "--color-progression",
    useful: "--color-useful",
    filler: "--color-filler",
    trap: "--color-trap",
    player: "--color-player",
    playerSelf: "--color-player-self",
    location: "--color-location",
    entrance: "--color-entrance",
    inLogic: "--color-in-logic",
    found: "--color-found",
    hinted: "--color-hinted",
    hardLogic: "--color-hard-logic",
    outOfLogic: "--color-out-of-logic",
  };

  for (const [key, cssVar] of Object.entries(colorVarMap)) {
    root.style.setProperty(cssVar, settings.colors[key as keyof APColors]);
  }
}

/** Write current settings to localStorage. */
function persistSettings() {
  localStorage.setItem("ap-tracker-settings", JSON.stringify(settings));
}

/** Reset all colors to the default palette. */
export function resetColors() {
  Object.assign(settings.colors, DEFAULT_COLORS);
}

/** Reset all settings (theme, colors, filters) to defaults. */
export function resetAllSettings() {
  settings.theme = "dark";
  resetColors();
  resetMessageFilters();
  resetShapesanitySettings();
}

/** Reset shapesanity-specific settings. */
export function resetShapesanitySettings() {
  settings.shapesanity = {
    useHardLogic: false,
    // useHardLogic: true, // FIX: change this after hard logic fully implemented
    filter: {
      inLogic: false,
      outOfLogic: false,
      found: false,
      hinted: false,
      hardLogic: false,
    },
    sort: "default",
    sortDirection: "asc",
    sortState: {
      inLogic: 1,
      outOfLogic: 3,
      found: 4,
      hinted: 0,
      hardLogic: 2,
    }
  };
}

/** Re-enable all message type filters. */
export function resetMessageFilters() {
  Object.assign(settings.messageFilters, defaultMessageFilters());
}

// Automatically apply and persist whenever any setting changes.
watch(
  () => ({ ...settings, colors: { ...settings.colors } }),
  () => {
    applySettings();
    persistSettings();
  },
  { deep: true, immediate: true },
);
