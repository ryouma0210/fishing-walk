import { FISHING_AREAS, FishingArea } from "../constants/areas";
import { getState, setState } from "../database/db";

const SELECTED_AREA_KEY = "selected_fishing_area";

export async function getSelectedArea(): Promise<FishingArea> {
  const id = await getState<string>(SELECTED_AREA_KEY);
  return FISHING_AREAS.find((area) => area.id === id) ?? FISHING_AREAS[0];
}

export async function selectArea(area: FishingArea) {
  await setState(SELECTED_AREA_KEY, area.id);
}
