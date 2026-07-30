import * as Location from "expo-location";
import { createFishingSpots, FishingSpot } from "../constants/game";
import { getState, setState } from "../database/db";

export type StoredLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
};

function toStoredLocation(coords: Location.LocationObjectCoords, timestamp: number): StoredLocation {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    updatedAt: new Date(timestamp).toISOString(),
  };
}

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
  const location = toStoredLocation(current.coords, current.timestamp);
  await setState(LOCATION_KEY, location);
  let spots = await getState<FishingSpot[]>(SPOTS_KEY);
  const usesOldDefaults = spots?.some((spot) => spot.id.endsWith("-local"));
  if (!spots?.length || usesOldDefaults) {
    spots = createFishingSpots(location.latitude, location.longitude);
    await setState(SPOTS_KEY, spots);
    await setState(SELECTED_SPOT_KEY, spots[0]);
  }
  return { status: "granted" as const, location, spots };
}

export async function watchCurrentLocation(onUpdate: (location: StoredLocation) => void) {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== "granted") return null;
  let lastUpdate = 0;
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30_000,
      distanceInterval: 0,
    },
    async (current) => {
      if (current.timestamp - lastUpdate < 30_000) return;
      lastUpdate = current.timestamp;
      const location = toStoredLocation(current.coords, current.timestamp);
      await setState(LOCATION_KEY, location);
      onUpdate(location);
    },
  );
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

export async function addPoiFishingSpot(input: {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
}) {
  const name = input.name || "マップの釣り場";
  const placeType = /駅|station/i.test(name) ? "station"
    : /公園|park|庭園/i.test(name) ? "park"
      : "restaurant";
  const habitat = placeType === "park" ? "pond" : placeType === "station" ? "river" : "lake";
  const spot: FishingSpot = {
    id: `poi-${input.placeId}`,
    name,
    habitat,
    emoji: placeType === "park" ? "🌳" : placeType === "station" ? "🚉" : "🍽️",
    latitude: input.latitude,
    longitude: input.longitude,
    unlockSteps: 0,
    placeType,
  };
  const current = await getState<FishingSpot[]>(SPOTS_KEY) ?? [];
  const spots = [...current.filter((entry) => entry.id !== spot.id), spot];
  await setState(SPOTS_KEY, spots);
  await setState(SELECTED_SPOT_KEY, spot);
  return { spot, spots };
}

export async function getSelectedSpot() {
  const state = await getMapState();
  return state.selectedSpot ?? state.spots[0];
}
