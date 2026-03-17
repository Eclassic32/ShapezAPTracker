/*
 * Shape generation utility for Shapez.io entities
 * Converted from original game files
 */

const MAX_LAYER = 4;

export const SubShape = {
  RECT: "rect",
  CIRCLE: "circle",
  STAR: "star",
  WINDMILL: "windmill",
} as const;

export type SubShape = typeof SubShape[keyof typeof SubShape];

export const ShapeColor = {
  RED: "red",
  GREEN: "green",
  BLUE: "blue",
  YELLOW: "yellow",
  PURPLE: "purple",
  CYAN: "cyan",
  WHITE: "white",
  UNCOLORED: "uncolored",
} as const;

export type ShapeColor = typeof ShapeColor[keyof typeof ShapeColor];

const enumSubShapeToShortcode: Record<SubShape, string> = {
  [SubShape.RECT]: "R",
  [SubShape.CIRCLE]: "C",
  [SubShape.STAR]: "S",
  [SubShape.WINDMILL]: "W",
};

const enumShortcodeToSubShape: Record<string, SubShape> = {
  "R": SubShape.RECT,
  "C": SubShape.CIRCLE,
  "S": SubShape.STAR,
  "W": SubShape.WINDMILL,
};

const enumColorToShortcode: Record<ShapeColor, string> = {
  [ShapeColor.RED]: "r",
  [ShapeColor.GREEN]: "g",
  [ShapeColor.BLUE]: "b",
  [ShapeColor.YELLOW]: "y",
  [ShapeColor.PURPLE]: "p",
  [ShapeColor.CYAN]: "c",
  [ShapeColor.WHITE]: "w",
  [ShapeColor.UNCOLORED]: "u",
};

const enumShortcodeToColor: Record<string, ShapeColor> = {
  "r": ShapeColor.RED,
  "g": ShapeColor.GREEN,
  "b": ShapeColor.BLUE,
  "y": ShapeColor.YELLOW,
  "p": ShapeColor.PURPLE,
  "c": ShapeColor.CYAN,
  "w": ShapeColor.WHITE,
  "u": ShapeColor.UNCOLORED,
};

const enumColorsToHexCode: Record<ShapeColor, string> = {
  [ShapeColor.RED]: "#ff666a",
  [ShapeColor.GREEN]: "#78ff66",
  [ShapeColor.BLUE]: "#66a7ff",
  [ShapeColor.YELLOW]: "#fcf52a",
  [ShapeColor.PURPLE]: "#dd66ff",
  [ShapeColor.CYAN]: "#87fff5",
  [ShapeColor.WHITE]: "#ffffff",
  [ShapeColor.UNCOLORED]: "#aaaaaa",
};

const arrayQuadrantIndexToOffset = [
  { x: 1, y: -1 },  // tr
  { x: 1, y: 1 },   // br
  { x: -1, y: 1 },  // bl
  { x: -1, y: -1 }, // tl
];

interface ShapeQuadrant {
  subShape: SubShape;
  color: ShapeColor;
}

type ShapeLayer = (ShapeQuadrant | null)[];

const possibleShapesString = Object.keys(enumShortcodeToSubShape).join("");
const possibleColorsString = Object.keys(enumShortcodeToColor).join("");
const layerRegex = new RegExp(
  "([" + possibleShapesString + "][" + possibleColorsString + "]|-{2}){4}"
);

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180.0;
}

/**
 * Generates the layer definition from the given short key
 */
export function fromShortKey(key: string): ShapeLayer[] {
  const sourceLayers = key.split(":");
  if (sourceLayers.length > MAX_LAYER) {
    throw new Error("Only " + MAX_LAYER + " layers allowed");
  }

  const layers: ShapeLayer[] = [];
  for (let i = 0; i < sourceLayers.length; ++i) {
    const text = sourceLayers[i];
    if (!text) {
      throw new Error("Invalid layer: undefined layer at index " + i);
    }
    if (text.length !== 8) {
      throw new Error("Invalid layer: '" + text + "' -> must be 8 characters");
    }

    if (text === "--".repeat(4)) {
      throw new Error("Empty layers are not allowed");
    }

    if (!layerRegex.test(text)) {
      throw new Error("Invalid syntax in layer " + (i + 1));
    }

    const quads: (ShapeQuadrant | null)[] = [null, null, null, null];
    for (let quad = 0; quad < 4; ++quad) {
      const shapeText = text[quad * 2 + 0];
      const colorText = text[quad * 2 + 1];
      
      if (!shapeText || !colorText) {
        throw new Error("Invalid layer format at quadrant " + quad);
      }
      
      const subShape = enumShortcodeToSubShape[shapeText];
      const color = enumShortcodeToColor[colorText];
      if (subShape) {
        if (!color) {
          throw new Error("Invalid shape color key: " + key);
        }
        quads[quad] = {
          subShape,
          color,
        };
      } else if (shapeText !== "-") {
        throw new Error("Invalid shape key: " + shapeText);
      }
    }
    layers.push(quads);
  }

  return layers;
}

/**
 * Renders a shape to a canvas and returns it as a data URL
 */
export function renderShapeToCanvas(layers: ShapeLayer[], size = 128): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }

  context.save();

  const w = size;
  const h = size;
  const dpi = 1;

  context.translate((w * dpi) / 2, (h * dpi) / 2);
  context.scale((dpi * w) / 28, (dpi * h) / 28);

  const quadrantSize = 10;
  const quadrantHalfSize = quadrantSize / 2;

  for (let layerIndex = 0; layerIndex < layers.length; ++layerIndex) {
    const quadrants = layers[layerIndex];
    const layerScale = Math.max(0.1, 0.9 - layerIndex * 0.22);

    for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
      const quadrant = quadrants?.[quadrantIndex];
      if (!quadrant) {
        continue;
      }
      const { subShape, color } = quadrant;

      const quadrantPos = arrayQuadrantIndexToOffset[quadrantIndex];
      if (!quadrantPos) {
        continue;
      }
      const centerQuadrantX = quadrantPos.x * quadrantHalfSize;
      const centerQuadrantY = quadrantPos.y * quadrantHalfSize;

      const rotation = radians(quadrantIndex * 90);

      context.translate(centerQuadrantX, centerQuadrantY);
      context.rotate(rotation);

      context.fillStyle = enumColorsToHexCode[color];
      context.strokeStyle = "#555";
      context.lineWidth = 1;

      const insetPadding = 0.0;

      switch (subShape) {
        case SubShape.RECT: {
          context.beginPath();
          const dims = quadrantSize * layerScale;
          context.rect(
            insetPadding + -quadrantHalfSize,
            -insetPadding + quadrantHalfSize - dims,
            dims,
            dims
          );
          break;
        }
        case SubShape.STAR: {
          context.beginPath();
          const dims = quadrantSize * layerScale;
          const originX = insetPadding - quadrantHalfSize;
          const originY = -insetPadding + quadrantHalfSize - dims;
          const moveInwards = dims * 0.4;
          context.moveTo(originX, originY + moveInwards);
          context.lineTo(originX + dims, originY);
          context.lineTo(originX + dims - moveInwards, originY + dims);
          context.lineTo(originX, originY + dims);
          context.closePath();
          break;
        }
        case SubShape.WINDMILL: {
          context.beginPath();
          const dims = quadrantSize * layerScale;
          const originX = insetPadding - quadrantHalfSize;
          const originY = -insetPadding + quadrantHalfSize - dims;
          const moveInwards = dims * 0.4;
          context.moveTo(originX, originY + moveInwards);
          context.lineTo(originX + dims, originY);
          context.lineTo(originX + dims, originY + dims);
          context.lineTo(originX, originY + dims);
          context.closePath();
          break;
        }
        case SubShape.CIRCLE: {
          context.beginPath();
          context.moveTo(
            insetPadding + -quadrantHalfSize,
            -insetPadding + quadrantHalfSize
          );
          context.arc(
            insetPadding + -quadrantHalfSize,
            -insetPadding + quadrantHalfSize,
            quadrantSize * layerScale,
            -Math.PI * 0.5,
            0
          );
          context.closePath();
          break;
        }
      }

      context.fill();
      context.stroke();

      context.rotate(-rotation);
      context.translate(-centerQuadrantX, -centerQuadrantY);
    }
  }

  context.restore();
  return canvas;
}

/**
 * Renders a shape from short key to a data URL
 */
export function renderShape(shortKey: string, size = 128): string {
  const layers = fromShortKey(shortKey);
  const canvas = renderShapeToCanvas(layers, size);
  return canvas.toDataURL('image/png');
}

/**
 * Generate a random shape short key
 */
export function generateRandomShape(): string {
  const shapes = [...Object.values(enumSubShapeToShortcode), "-"];
  const colors = Object.values(enumColorToShortcode);
  
  const numLayers = Math.floor(Math.random() * MAX_LAYER) + 1;
  const layerCodes: string[] = [];
  
  for (let i = 0; i < numLayers; i++) {
    let layerText = "";
    for (let q = 0; q < 4; q++) {
      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      let randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      if (!randomShape || !randomColor) {
        continue;
      }
      
      if (randomShape === "-") {
        randomColor = "-";
      }
      layerText += randomShape + randomColor;
    }
    
    // Empty layer not allowed
    if (layerText === "--------") {
      i--;
    } else {
      layerCodes.push(layerText);
    }
  }
  
  return layerCodes.join(":");
}
