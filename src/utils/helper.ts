export function isBuildingAvailable(buildingName: string): boolean {
  if (buildingName === 'Lever_on') {
    return false;
  }
  return true;
}