import Constants from "expo-constants";

type Coordinate = { latitude: number; longitude: number };
export type WalkingRoute = {
  coordinates: Coordinate[];
  distanceMeters: number;
  durationSeconds: number;
};

function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return coordinates;
}

export async function calculateWalkingRoute(origin: Coordinate, destination: Coordinate): Promise<WalkingRoute> {
  const apiKey = Constants.expoConfig?.extra?.googleRoutesApiKey as string | undefined;
  if (!apiKey) throw new Error("missing-api-key");
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
    },
    body: JSON.stringify({
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: "WALK",
      routingPreference: "TRAFFIC_UNAWARE",
      languageCode: "ja",
      units: "METRIC",
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    if (/API key expired/i.test(detail)) throw new Error("api-key-expired");
    if (/SERVICE_DISABLED|has not been used|is disabled/i.test(detail)) throw new Error("routes-api-disabled");
    throw new Error(`routes-api-${response.status}:${detail.slice(0, 180)}`);
  }
  const data = await response.json() as {
    routes?: { duration?: string; distanceMeters?: number; polyline?: { encodedPolyline?: string } }[];
  };
  const route = data.routes?.[0];
  const encoded = route?.polyline?.encodedPolyline;
  if (!route || !encoded) throw new Error("route-not-found");
  return {
    coordinates: decodePolyline(encoded),
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds: Number.parseInt(route.duration ?? "0", 10) || 0,
  };
}
