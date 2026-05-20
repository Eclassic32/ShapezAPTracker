import { receivedItems, type SerializedItem } from "@/stores/archipelago";

function getItemsAll(): string[] {
  return receivedItems.map((item: SerializedItem) => item.name);
}

function getItemsUnique(): string[] {
  return [...new Set(getItemsAll())];
}

class AchievementLogic {
  static allBuildings = [ "Belt", "Extractor", "Chaining Extractor", "Trash",
    "Rotator", "Rotator (CCW)", "Rotator (180°)", "Tunnel", "Tunnel Tier II",
    "Balancer", "Compact Merger", "Compact Splitter",
    "Display", "Item Filter", "Belt Reader", "Switch",
    "Cutter", "Quad Cutter", "Stacker",
    "Painter", "Double Painter", "Quad Painter", "Color Mixer",
    "Wire", "Constant Signal", "Logic Gates", "Virtual Processing"
  ];

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

  static hasAnyBuilding(): boolean {
    return this.hasAny(this.allBuildings);
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

  static canMove(): boolean {
    return this.hasAny(["Belt", "Compact Merger", "Compact Splitter"]);
  }

  static canMoveHard(): boolean {
    return this.hasAny(["Belt", "Balancer", "Compact Merger", "Compact Splitter"]);
  }

  static canMine(): boolean {
    return this.hasAny(["Extractor", "Chaining Extractor"]);
  }

  static canStartGame(): boolean {
    return this.canMine() && this.canMove();
  }

  static canStartGameHard(): boolean {
    return this.canMine() && this.canMoveHard();
  }
  
};

function parseLogicArgs(rawArgs: string): unknown[] {
  const trimmed = rawArgs.trim();
  if (!trimmed) return [];

  return trimmed.split(",").map((part) => {
    const value = part.trim();
    if (value === "true") return true;
    if (value === "false") return false;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    return value;
  });
}

const logicObject = AchievementLogic as unknown as Record<
  string,
  (...args: unknown[]) => boolean
>;

function evaluateLogicExpression(expression: string): boolean {
  const trimmed = expression.trim();
  if (!trimmed) return true;

  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?$/);
  if (!match) return true;

  const [, methodName, rawArgs] = match;
  const method = logicObject[methodName];
  if (typeof method !== "function") return true;

  const args = rawArgs === undefined ? [] : parseLogicArgs(rawArgs);
  return method.apply(AchievementLogic, args);
}

export function isAchievementInLogic(logic?: string[]): boolean {
  if (!logic || logic.length === 0) return true;
  return logic.every((entry) => evaluateLogicExpression(entry));
}

export function isAchievementInHardLogic(logic?: string[]): boolean {
  if (!logic || logic.length === 0) return false;
  return logic.every((entry) => evaluateLogicExpression(entry));
}
