import * as Location from "expo-location";
import { createFishingSpots, FishingSpot } from "../constants/game";
import { getState, setState } from "../database/db";

export type StoredLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
};

const SPOTS_KEY = "fishing_spots";
const LOCATION_KEY = "last_location";
const SELECTED_SPOT_KEY = "selected_spot";

export function distanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const radius = 6371000;
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const deltaLat = (to.latitude - from.latitude) * Math.PI / 180;
  const deltaLon = (to.longitude - from.longitude) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function requestCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") return { status: "denied" as const, location: null };
  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const location: StoredLocation = {
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
    accuracy: current.coords.accuracy,
    updatedAt: new Date(current.timestamp).toISOString(),
  };
  await setState(LOCATION_KEY, location);
  let spots = await getState<FishingSpot[]>(SPOTS_KEY);
  if (!spots?.length) {
    spots = createFishingSpots(location.latitude, location.longitude);
    await setState(SPOTS_KEY, spots);
    await setState(SELECTED_SPOT_KEY, spots[0]);
  }
  return { status: "granted" as const, location, spots };
}

export async function getMapState() {
  const [location, spots, selectedSpot] = await Promise.all([
    getState<StoredLocation>(LOCATION_KEY),
    getState<FishingSpot[]>(SPOTS_KEY),
    getState<FishingSpot>(SELECTED_SPOT_KEY),
  ]);
  const fallback = location ?? {
    latitude: 35.6812,
    longitude: 139.7671,
    accuracy: null,
    updatedAt: new Date().toISOString(),
  };
  return {
    location,
    spots: spots?.length ? spots : createFishingSpots(fallback.latitude, fallback.longitude),
    selectedSpot,
  };
}

export async function selectSpot(spot: FishingSpot) {
  await setState(SELECTED_SPOT_KEY, spot);
}

export async function getSelectedSpot() {
  const state = await getMapState();
  return state.selectedSpot ?? state.spots[0];
}
