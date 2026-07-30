import { useCallback, useRef, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Card, ui } from "../../src/components/ui";
import { FishingSpot, HABITAT_NAMES } from "../../src/constants/game";
import { colors } from "../../src/constants/theme";
import { fishingMapStyle } from "../../src/constants/mapStyle";
import {
  addPoiFishingSpot,
  distanceMeters,
  getMapState,
  requestCurrentLocation,
  selectSpot,
  StoredLocation,
  watchCurrentLocation,
} from "../../src/services/locationService";
import { syncTodaySteps } from "../../src/services/stepService";

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const tiltedRef = useRef(false);
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [selected, setSelected] = useState<FishingSpot | null>(null);
  const [steps, setSteps] = useState(0);
  const [status, setStatus] = useState("位置情報を確認中");

  const load = useCallback(async () => {
    const saved = await getMapState();
    setLocation(saved.location);
    setSpots(saved.spots);
    setSelected(null);
    setSteps((await syncTodaySteps()).steps);
    try {
      const result = await requestCurrentLocation();
      if (result.status === "denied") {
        setStatus("位置情報の許可が必要です");
        return;
      }
      if (result.location) {
        setLocation(result.location);
        setSpots(result.spots ?? saved.spots);
        setStatus(`現在地を取得しました（精度 約${Math.round(result.location.accuracy ?? 0)}m）`);
        mapRef.current?.animateToRegion({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          latitudeDelta: 0.0054,
          longitudeDelta: 0.0054,
        }, 500);
      }
    } catch {
      setStatus("現在地を取得できません。保存済みの地図を表示します");
    }
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    let subscription: Awaited<ReturnType<typeof watchCurrentLocation>> = null;
    load().then(async () => {
      subscription = await watchCurrentLocation((nextLocation) => {
        if (!active) return;
        setLocation(nextLocation);
        setStatus(`現在地を更新しました（精度 約${Math.round(nextLocation.accuracy ?? 0)}m）`);
      });
      if (!active) subscription?.remove();
    });
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [load]));

  const choose = async (spot: FishingSpot) => {
    setSelected(spot);
    await selectSpot(spot);
  };

  const addPoi = async (event: { nativeEvent: { placeId: string; name: string; coordinate: { latitude: number; longitude: number } } }) => {
    const poi = event.nativeEvent;
    const result = await addPoiFishingSpot({
      placeId: poi.placeId,
      name: poi.name,
      latitude: poi.coordinate.latitude,
      longitude: poi.coordinate.longitude,
    });
    setSpots(result.spots);
    setSelected(result.spot);
    setStatus(`${result.spot.emoji} ${result.spot.name}を釣り場に設定しました`);
  };

  const updatePerspective = (region: Region) => {
    const shouldTilt = region.latitudeDelta <= 0.0018;
    if (shouldTilt === tiltedRef.current) return;
    tiltedRef.current = shouldTilt;
    mapRef.current?.animateCamera({ pitch: shouldTilt ? 55 : 0 }, { duration: 350 });
  };

  const changeZoom = async (delta: number) => {
    const camera = await mapRef.current?.getCamera();
    if (!camera) return;
    const zoom = Math.max(3, Math.min(21, (camera.zoom ?? 18) + delta));
    const shouldTilt = zoom >= 19.5;
    tiltedRef.current = shouldTilt;
    mapRef.current?.animateCamera({ zoom, pitch: shouldTilt ? 55 : 0 }, { duration: 300 });
  };

  const openWalkingRoute = async () => {
    if (!selected) return;
    const destination = `${selected.latitude},${selected.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    await Linking.openURL(url);
  };

  const distance = selected && location ? Math.round(distanceMeters(location, selected)) : null;
  const stepUnlocked = selected ? steps >= selected.unlockSteps : false;
  const nearby = distance !== null && distance <= 300;
  const canFish = Boolean(selected && stepUnlocked && nearby);
  const initial: Region = {
    latitude: location?.latitude ?? 35.6812,
    longitude: location?.longitude ?? 139.7671,
    latitudeDelta: 0.0054,
    longitudeDelta: 0.0054,
  };

  return (
    <View style={styles.screen}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={initial}
          customMapStyle={fishingMapStyle}
          mapType="standard"
          pitchEnabled
          rotateEnabled
          zoomEnabled
          showsCompass
          showsMyLocationButton
          showsUserLocation
          showsBuildings
          showsIndoors
          toolbarEnabled={false}
          onPoiClick={addPoi}
          onRegionChangeComplete={updatePerspective}
        >
          {location && (
            <Circle
              center={location}
              radius={300}
              fillColor="rgba(33,182,168,0.12)"
              strokeColor={colors.aqua}
            />
          )}
          {spots.map((spot) => {
            const unlocked = steps >= spot.unlockSteps;
            return (
              <Marker
                key={spot.id}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                title={`${spot.emoji} ${spot.name}`}
                description={unlocked ? `${HABITAT_NAMES[spot.habitat]}の釣り場` : `${spot.unlockSteps.toLocaleString()}歩で解放`}
                opacity={unlocked ? 1 : 0.48}
                onPress={() => choose(spot)}
              >
                <View style={[styles.beacon, !unlocked && styles.beaconLocked]}>
                  <View style={[styles.beaconHalo, selected?.id === spot.id && styles.beaconSelected]}>
                    <Text style={styles.beaconEmoji}>{unlocked ? spot.emoji : "🔒"}</Text>
                  </View>
                  <View style={styles.beaconStem} />
                  <View style={styles.beaconBase} />
                </View>
              </Marker>
            );
          })}
        </MapView>
      <View style={[styles.titleHud, { top: insets.top + 10 }]}>
        <Text style={styles.title}>Fishing Map</Text>
        <Text numberOfLines={2} style={styles.status}>{status}</Text>
        <Text style={styles.poiHint}>飲食店・駅・公園をタップして釣り場に設定</Text>
      </View>
      <View style={[styles.mapHud, { top: insets.top + 18 }]}>
        <Text style={styles.mapHudLabel}>TODAY</Text>
        <Text style={styles.mapHudValue}>{steps.toLocaleString()}歩</Text>
      </View>
      <View style={[styles.zoomControls, { top: insets.top + 116 }]}>
        <Pressable accessibilityLabel="地図を拡大" onPress={() => changeZoom(1)} style={styles.zoomButton}>
          <Text style={styles.zoomText}>＋</Text>
        </Pressable>
        <View style={styles.zoomDivider} />
        <Pressable accessibilityLabel="地図を縮小" onPress={() => changeZoom(-1)} style={styles.zoomButton}>
          <Text style={styles.zoomText}>−</Text>
        </Pressable>
      </View>
      {selected && (
        <Card style={styles.spotCard}>
          <View style={ui.between}>
            <View>
              <Text style={styles.spotName}>{selected.emoji} {selected.name}</Text>
              <Text style={ui.muted}>{HABITAT_NAMES[selected.habitat]} ・ {distance === null ? "距離不明" : `${distance}m先`}</Text>
            </View>
            <Text style={[styles.state, { color: canFish ? colors.ocean : colors.coral }]}>
              {canFish ? "釣り可能" : !stepUnlocked ? `${selected.unlockSteps.toLocaleString()}歩で解放` : "300m以内へ移動"}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable onPress={openWalkingRoute} style={({ pressed }) => [styles.routeButton, pressed && styles.dim]}>
              <Text style={styles.routeButtonText}>Googleマップで徒歩ナビ</Text>
            </Pressable>
            <Pressable
              disabled={!canFish}
              onPress={() => router.push("/(tabs)/fish")}
              style={({ pressed }) => [styles.fishButton, (!canFish || pressed) && styles.dim]}
            >
              <Text style={styles.fishButtonText}>この場所で釣る</Text>
            </Pressable>
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.foam },
  map: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  titleHud: { position: "absolute", left: 12, right: 12, backgroundColor: "rgba(255,255,255,.94)", borderRadius: 17, paddingHorizontal: 14, paddingVertical: 10, shadowColor: colors.navy, shadowOpacity: .14, shadowRadius: 8 },
  title: { fontSize: 20, fontWeight: "900", color: colors.navy },
  status: { fontSize: 11, color: colors.muted, marginTop: 1, paddingRight: 90 },
  poiHint: { fontSize: 10, color: colors.ocean, fontWeight: "800", marginTop: 4 },
  spotCard: { position: "absolute", left: 12, right: 12, bottom: 12, gap: 10, padding: 13 },
  spotName: { fontSize: 18, fontWeight: "900", color: colors.ink },
  state: { fontSize: 12, fontWeight: "900", maxWidth: 105, textAlign: "right" },
  actions: { flexDirection: "row", gap: 8 },
  routeButton: { flex: 0.52, backgroundColor: colors.foam, borderWidth: 1, borderColor: colors.aqua, padding: 12, borderRadius: 13, alignItems: "center" },
  routeButtonText: { color: colors.navy, fontWeight: "900" },
  fishButton: { flex: 0.48, backgroundColor: colors.coral, padding: 12, borderRadius: 13, alignItems: "center" },
  fishButtonText: { color: colors.white, fontWeight: "900" },
  dim: { opacity: 0.45 },
  beacon: { width: 68, height: 94, alignItems: "center" },
  beaconLocked: { opacity: 0.42 },
  beaconHalo: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,.94)", borderWidth: 4, borderColor: colors.aqua, alignItems: "center", justifyContent: "center", shadowColor: colors.ocean, shadowOpacity: 0.35, shadowRadius: 8 },
  beaconSelected: { borderColor: colors.coral, transform: [{ scale: 1.12 }] },
  beaconEmoji: { fontSize: 25 },
  beaconStem: { width: 5, height: 25, backgroundColor: colors.ocean },
  beaconBase: { width: 28, height: 9, borderRadius: 10, backgroundColor: colors.aqua, borderWidth: 2, borderColor: colors.white },
  mapHud: { position: "absolute", right: 20, backgroundColor: "rgba(6,59,76,.9)", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,255,255,.55)" },
  mapHudLabel: { color: colors.aqua, fontSize: 9, fontWeight: "900" },
  mapHudValue: { color: colors.white, fontSize: 16, fontWeight: "900" },
  zoomControls: { position: "absolute", right: 18, width: 46, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(255,255,255,.96)", borderWidth: 1, borderColor: colors.line, shadowColor: colors.navy, shadowOpacity: .18, shadowRadius: 7 },
  zoomButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  zoomText: { fontSize: 25, lineHeight: 28, fontWeight: "700", color: colors.navy },
  zoomDivider: { height: 1, backgroundColor: colors.line },
});
