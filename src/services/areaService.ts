import { FISHING_AREAS, FishingArea } from "../constants/areas";
import { getState, setState } from "../database/db";

const SELECTED_AREA_KEY = "selected_fishing_area";
const UNLOCKED_AREAS_KEY = "unlocked_fishing_areas";

export async function getSelectedArea(): Promise<FishingArea> {
  const id = await getState<string>(SELECTED_AREA_KEY);
  return FISHING_AREAS.find((area) => area.id === id) ?? FISHING_AREAS[0];
}

export async function selectArea(area: FishingArea) {
  await setState(SELECTED_AREA_KEY, area.id);
}

export async function getUnlockedAreaIds(): Promise<Set<string>> {
  const saved = await getState<string[]>(UNLOCKED_AREAS_KEY);
  if (Array.isArray(saved) && saved.length > 0) return new Set(saved);

  // 手動解放機能の導入前から利用している端末は、現在地までの進行を維持する。
  const selectedId = await getState<string>(SELECTED_AREA_KEY);
  const selectedIndex = Math.max(0, FISHING_AREAS.findIndex((area) => area.id === selectedId));
  const initialIds = FISHING_AREAS.slice(0, selectedIndex + 1).map((area) => area.id);
  await setState(UNLOCKED_AREAS_KEY, initialIds);
  return new Set(initialIds);
}

export async function unlockArea(area: FishingArea): Promise<Set<string>> {
  const unlocked = await getUnlockedAreaIds();
  unlocked.add(area.id);
  await setState(UNLOCKED_AREAS_KEY, [...unlocked]);
  return unlocked;
}
