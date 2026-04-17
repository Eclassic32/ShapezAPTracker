/**
 * shapesanity-logic.ts — Shapesanity Logic & Derived State
 *
 * Extracted from the old monolithic `archipelago-helper.ts`. Contains:
 * - `Logic` class: static methods for checking item-based logic conditions
 * - `assignShapeLogic()`: determines which logic conditions a shape requires
 * - `isInLogic()`: checks if all logic conditions are met
 * - `isBuildingAvailable()`: checks if a building item has been received
 * - `buildShapesanity()`: expensive one-time build of the shapesanity grid
 * - `refreshShapesanityHintsAndLocations()`: cheap re-derive of hint/found/logic
 *
 * All functions read from the template's reactive exports in `@/stores/archipelago`
 * (`receivedItems`, `hints`, `checkedLocations`, `slotData`, `client`).
 */

import { shallowRef } from "vue";
import {
  receivedItems,
  hints,
  checkedLocations,
  slotData,
  client,
  type SerializedItem,
  type SerializedHint,
} from "@/stores/archipelago";
// @ts-expect-error — shapesanity.js has no type declarations
import { shapesanityArrayToCodes, shapesanityRegion } from "./shapesanity";
import { fromShortKey, renderShape } from "./shape-generator";

/* ==========================================================================
   Shapesanity Entry Type
   ========================================================================== */

export interface ShapesanityEntry {
  /** The short shape code (e.g. "CuCuCuCu"). */
  code: string;
  /** Human-readable name from slot data (e.g. "Uncolored Circle"). */
  name: string;
  /** Location name in the multiworld (e.g. "Shapesanity 1"). */
  location: string;
  /** Parsed shape layers from `fromShortKey`. */
  shape: ReturnType<typeof fromShortKey>;
  /** Data URL of the rendered shape image. */
  image: string;
  /** The hint object if this location is hinted, or null. */
  hint: SerializedHint | null;
  /** Whether this location has been checked/sent. */
  found: boolean;
  /** Array of logic condition names required for this shape. */
  logic: string[] | false;
  /** Whether this shape has floating piece (used by logic) */
  floating: boolean;
  region: string;
}

/* ==========================================================================
   Reactive State
   ========================================================================== */

/**
 * The full shapesanity grid. Built once after login via `buildShapesanity()`,
 * then cheaply updated via `refreshShapesanityHintsAndLocations()`.
 *
 * Uses `shallowRef` so Vue only tracks reference changes (the array is
 * replaced atomically on every update).
 */
export const shapesanityRef = shallowRef<ShapesanityEntry[]>([]);
if (import.meta.env.DEV) {
  // @ts-expect-error — attach to window for dev debugging
  window.__shapesanityRef = shapesanityRef;
}

/* ==========================================================================
   Derived item helpers (read from template store)
   ========================================================================== */

/** All received item names (with duplicates, in order). */
function getItemsAll(): string[] {
  return receivedItems.map((i: SerializedItem) => i.name);
}

/** Unique received item names. */
function getItemsUnique(): string[] {
  return [...new Set(getItemsAll())];
}

/* ==========================================================================
   Logic Class
   ========================================================================== */

class Logic {
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

  static canCutQuarter(): boolean {
    return this.has("Quad Cutter") || (this.canCutHalf() && this.canRotate90());
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

  static canBuildMAM(floating: boolean): boolean {
    return (
      this.canMakeStitchedShape(floating) &&
      this.canPaint() &&
      this.canMixColors() &&
      this.hasBalancer() &&
      this.hasTunnel()
    );
  }

  static canMakeEastWindmill(): boolean {
    return (
      this.canStack() &&
      (this.has("Quad Cutter") || (this.canCutHalf() && this.canRotate180()))
    );
  }

  static canMakeHalfHalfShape(): boolean {
    return this.canStack() && this.hasAny(["Quad Cutter", "Cutter"]);
  }

  static canMakeHalfShape(): boolean {
    return this.canCutHalf() || this.hasAll(["Quad Cutter", "Stacker"]);
  }

  static canMakeColFull(floating: boolean): boolean {
    return this.canMakeStitchedShape(floating) || this.canUseQuadPainter();
  }

  static canMakeColEastWindmill(floating: boolean): boolean {
    return this.canMakeStitchedShape(floating) || (this.canUseQuadPainter() && this.canMakeEastWindmill());
  }

  static canMakeColHalfHalf(floating: boolean): boolean {
    return this.canMakeStitchedShape(floating) || (this.canUseQuadPainter() && this.canMakeHalfHalfShape());
  }

  static canMakeColHalf(floating: boolean): boolean {
    return this.canMakeStitchedShape(floating) || (this.canUseQuadPainter() && this.canMakeHalfShape());
  }

  static hasFloatingCorner(
    shape: Array<Array<{ color: string } | null>>,
  ): boolean {
    const layers = shape.length;
    const corners = shape[0]!.length;

    for (let layer = 0; layer < layers; layer++) {
      for (let corner = 0; corner < corners; corner++) {
        if (shape[layer]![corner] === null) {
          for (
            let higherLayer = layer + 1;
            higherLayer < layers;
            higherLayer++
          ) {
            if (shape[higherLayer]![corner] !== null) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}

/* ==========================================================================
   Region → Logic Mapping
   ========================================================================== */

const regionsLogic: Record<string, string[]> = {
  full: [],
  half: ["canMakeHalfShape"],
  piece: ["canCutQuarter"],
  half_half: ["canMakeHalfHalfShape"],
  stitched: ["canMakeStitchedShape"],
  east_wind: ["canMakeEastWindmill"],
  col_full: ["canMakeColFull"],
  col_east_wind: ["canMakeColEastWindmill"],
  col_half_half: ["canMakeColHalfHalf"],
  col_half: ["canMakeColHalf"],
};

/* ==========================================================================
   Public Logic Functions
   ========================================================================== */

/**
 * Determine which logic conditions a shape requires based on its
 * properties (colors, layers) and its shapesanity region.
 */
export function assignShapeLogic(
  shape: ReturnType<typeof fromShortKey>,
  name: string,
): string[] | false {
  if (!shape) return false;

  const logic: string[] = [];

  const floating = Logic.hasFloatingCorner(
    shape as Array<Array<{ color: string } | null>>,
  );

  // Check for Color Logic
  if (
    shape.some((layer: unknown[]) =>
      layer.some(
        (corner: unknown) =>
          corner &&
          (corner as { color: string }).color !== "uncolored",
      ),
    )
  ) {
    logic.push("canPaint");
  }

  // Check for Mixed Colors Logic
  const mixedColors = ["cyan", "purple", "yellow", "white"];
  if (
    shape.some((layer: unknown[]) =>
      layer.some(
        (corner: unknown) =>
          corner &&
          mixedColors.includes((corner as { color: string }).color),
      ),
    )
  ) {
    logic.push("canMixColors");
  }

  // Check for Multi Layer Stacking Logic
  if (shape.length > 1) {
    logic.push("canStack");
  }

  // Region Logic
  const region = shapesanityRegion(name);
  if (region && regionsLogic[region]) {
    logic.push(...regionsLogic[region]);
  }

  return logic;
}

/**
 * Check whether all logic conditions in the array are currently met.
 * Returns true if no conditions (empty/null/false).
 */
export function isInLogic(logic: string[] | false | null, floating: boolean = false ): boolean {
  if (!logic) return true;

  const logicObj = Logic as unknown as Record<string, (...args: unknown[]) => boolean>;
  let result = true;
  logic.forEach((condition) => {
    const fn = logicObj[condition];
    if (typeof fn === "function") {
      result = result && fn.call(Logic);
    }
  });

  return result;
}

/**
 * Check if a building's item has been received.
 * Returns true if name is falsy or if not connected (assume available).
 */
export function isBuildingAvailable(name: string): boolean {
  if (!slotData.value) return true;

  return getItemsAll().includes(name);
}

/* ==========================================================================
   Hint / Location Helpers (read from template store)
   ========================================================================== */

/** Find a hint by location name, or return null. */
function findHintByLocationName(location: string): SerializedHint | null {
  return hints.find((h: SerializedHint) => h.location === location) ?? null;
}

/** Check if a location has been checked, by matching its name. */
function isLocationCheckedByName(location: string): boolean {
  const c = client.value;
  if (!c) return false;

  // checkedLocations contains numeric IDs; we need to resolve names
  for (const locId of checkedLocations) {
    try {
      const name = c.package.lookupLocationName("shapez", locId, true);
      if (name === location) return true;
    } catch {
      // skip unresolvable IDs
    }
  }
  return false;
}

/* ==========================================================================
   Shapesanity Build & Refresh
   ========================================================================== */

/**
 * Build the full shapesanity array from slot data. This is expensive
 * (renders images for each shape) and should only be called once after login.
 *
 * After this, call `refreshShapesanityHintsAndLocations()` to cheaply
 * update hint/found/logic status when items/hints/locations change.
 */
export function buildShapesanity(): ShapesanityEntry[] | null {
  const sd = slotData.value;
  if (!sd) return null;

  const raw = sd.shapesanity as string[] | undefined;
  if (!raw || !Array.isArray(raw)) return null;

  const codes = shapesanityArrayToCodes(raw) as Record<string, string>;

  const parsed: ShapesanityEntry[] = [];
  raw.forEach((name: string, index: number) => {
    const shapeCode = codes[name];
    if (!shapeCode) return;

    const shape = fromShortKey(shapeCode);
    parsed.push({
      code: shapeCode,
      name,
      location: `Shapesanity ${index + 1}`,
      shape,
      image: renderShape(shapeCode),
      hint: findHintByLocationName(`Shapesanity ${index + 1}`),
      found: isLocationCheckedByName(`Shapesanity ${index + 1}`),
      logic: assignShapeLogic(shape, name),
      floating: Logic.hasFloatingCorner(shape),
      region: shapesanityRegion(name),
    });
  });

  shapesanityRef.value = parsed;
  return parsed;
}

/**
 * Re-derive hint/found/logic status on each shapesanity entry without
 * regenerating images or re-parsing shape codes. Call this whenever
 * items, hints, or locations change.
 */
export function refreshShapesanityHintsAndLocations(): void {
  const current = shapesanityRef.value;
  if (!current || current.length === 0) return;

  const updated = current.map((entry) => ({
    ...entry,
    hint: findHintByLocationName(entry.location),
    found: isLocationCheckedByName(entry.location),
    logic: assignShapeLogic(entry.shape, entry.name),
  }));

  shapesanityRef.value = updated;
}
