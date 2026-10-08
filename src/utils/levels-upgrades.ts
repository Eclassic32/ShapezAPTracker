import { fromShortKey, renderShape } from "./shape-generator";
import { type ShapesanityEntry } from "./shapesanity-logic";

export const RegularLevels: RawLevelShapeEntry[] = [
  { level: 1,  code: "CuCuCuCu", name: "Circle", amount: 30, perSecond: false },
  { level: 2,  code: "----CuCu", name: "Half Circle", amount: 40, perSecond: false },
  { level: 3,  code: "RuRuRuRu", name: "Square", amount: 70, perSecond: false },
  { level: 4,  code: "RuRu----", name: "Half Square", amount: 125, perSecond: false },
  { level: 5,  code: "Cu----Cu", name: "Upper Half Circle", amount: 170, perSecond: false },
  { level: 6,  code: "Cu------", name: "Quarter Circle", amount: 270, perSecond: false },
  { level: 7,  code: "CrCrCrCr", name: "Red Circle", amount: 300, perSecond: false },
  { level: 8,  code: "RbRb----", name: "Half Blue Square", amount: 480, perSecond: false },
  { level: 9,  code: "CpCpCpCp", name: "Purple Circle", amount: 600, perSecond: false },
  { level: 10, code: "ScScScSc", name: "Cyan Star", amount: 800, perSecond: false },
  { level: 11, code: "CgScScCg", name: "Fish", amount: 1000, perSecond: false },
  { level: 12, code: "CbCbCbRb:CwCwCwCw", name: "Soul", amount: 1000, perSecond: false },
  { level: 13, code: "RpRpRpRp:CwCwCwCw", name: "Donut", amount: 3800, perSecond: false },
  { level: 14, code: "--Cg----:--Cr----", name: "Watermelon", amount: 8, perSecond: true },
  { level: 15, code: "SrSrSrSr:CyCyCyCy", name: "Sun", amount: 10000, perSecond: false },
  { level: 16, code: "SrSrSrSr:CyCyCyCy:SwSwSwSw", name: "Shining Sun", amount: 6000, perSecond: false },
  { level: 17, code: "CbRbRbCb:CwCwCwCw:WbWbWbWb", name: "Fan", amount: 20000, perSecond: false },
  { level: 18, code: "Sg----Sg:CgCgCgCg:--CyCy--", name: "Monster", amount: 20000, perSecond: false },
  { level: 19, code: "CpRpCp--:SwSwSwSw", name: "Claw", amount: 25000, perSecond: false },
  { level: 20, code: "RuCw--Cw:----Ru--", name: "Logo", amount: 25000, perSecond: false },
  { level: 21, code: "CrCwCrCw:CwCrCwCr:CrCwCrCw:CwCrCwCr", name: "Lollipop", amount: 25000, perSecond: false },
  { level: 22, code: "Cg----Cr:Cw----Cw:Sy------:Cy----Cy", name: "Speedometer", amount: 25000, perSecond: false },
  { level: 23, code: "CcSyCcSy:SyCcSyCc:CcSyCcSy", name: "Checker", amount: 25000, perSecond: false },
  { level: 24, code: "CcRcCcRc:RwCwRwCw:Sr--Sw--:CyCyCyCy", name: "Eye", amount: 25000, perSecond: false },
  { level: 25, code: "Rg--Rg--:CwRwCwRw:--Rg--Rg", name: "Interceptor", amount: 25000, perSecond: false },
  { level: 26, code: "CbCuCbCu:Sr------:--CrSrCr:CwCwCwCw", name: "Rocket", amount: 50000, perSecond: false },
];

interface RawLevelShapeEntry {
  code: string;
  name: string;
  level: number;
  amount: number;
  perSecond: boolean;
}

export interface LevelShapeEntry extends ShapesanityEntry {
    level: number;
    previousLevel: LevelShapeEntry | undefined;
    nextLevel: LevelShapeEntry | undefined;
    amount: number;
    perSecond: boolean;
}

export function compileRegularLevels() :LevelShapeEntry[] {
  let result :LevelShapeEntry[] = [];

  RegularLevels.forEach((level, idx) => {
    let entry :LevelShapeEntry = {
      code: level.code,
      name: level.name,
      location: `Level ${level.level} Complete`,
      shape: fromShortKey(level.code),
      image: renderShape(level.code),
      hint: null,
      found: false,
      logic: [],
      hardLogic: [],
      floating: false,
      region: "",
      level: level.level,
      amount: level.amount,
      perSecond: level.perSecond,
      previousLevel: undefined,
      nextLevel: undefined
    }
    if (result[idx-1]) {
      entry.previousLevel = result[idx-1];
      result[idx-1].nextLevel = entry;
    } 

    result.push(entry);
  })

  return result;
}