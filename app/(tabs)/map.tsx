import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Card, Header, Screen, ui } from "../../src/components/ui";
import { MapAvatar } from "../../src/components/GameArt";
import { FishingSpot, HABITAT_NAMES } from "../../src/constants/game";
import { colors } from "../../src/constants/theme";
import { fishingMapStyle } from "../../src/constants/mapStyle";
import { getEquippedItems } from "../../src/database/db";
import {
  distanceMeters,
  getMapState,
  requestCurrentLocation,
  selectSpot,
  StoredLocation,
} from "../../src/services/locationService";
import { syncTodaySteps } from "../../src/services/stepService";

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [selected, setSelected] = useState<FishingSpot | null>(null);
  const [steps, setSteps] = useState(0);
  const [status, setStatus] = useState("位置情報を確認中");
  const [avatarStage, setAvatarStage] = useState(0);

  const load = useCallback(async () => {
    const saved = await getMapState();
    setLocation(saved.location);
    setSpots(saved.spots);
    setSelected(saved.selectedSpot ?? saved.spots[0]);
    setSteps((await syncTodaySteps()).steps);
    const equipped = await getEquippedItems();
    setAvatarStage(equipped.some((item) => item.id === "rod4") ? 3 : equipped.length >= 5 ? 2 : equipped.length >= 2 ? 1 : 0);
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
          latitude: result.location.latitude + 0.0013,
          longitude: result.location.longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        }, 500);
        setTimeout(() => mapRef.current?.animateCamera({
          center: { latitude: result.location.latitude + 0.0013, longitude: result.location.longitude },
          pitch: 48,
          heading: 0,
          zoom: 17,
        }, { duration: 650 }), 550);
      }
    } catch {
      setStatus("現在地を取得できません。保存済みの地図を表示します");
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const choose = async (spot: FishingSpot) => {
    setSelected(spot);
    await selectSpot(spot);
  };

  const distance = selected && location ? Math.round(distanceMeters(location, selected)) : null;
  const stepUnlocked = selected ? steps >= selected.unlockSteps : false;
  const nearby = distance !== null && distance <= 300;
  const canFish = Boolean(selected && stepUnlocked && nearby);
  const initial: Region = {
    latitude: location?.latitude ?? 35.6812,
    longitude: location?.longitude ?? 139.7671,
    latitudeDelta: 0.018,
    longitudeDelta: 0.018,
  };

  return (
    <Screen scroll={false}>
      <Header title="Fishing Map" sub={status} />
      <View style={styles.mapWrap}>
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
          toolbarEnabled={false}
        >
          {location && (
            <Circle
              center={location}
              radius={300}
              fillColor="rgba(33,182,168,0.12)"
              strokeColor={colors.aqua}
            />
          )}
          {location && (
            <Marker coordinate={location} anchor={{ x: 0.5, y: 0.92 }} tracksViewChanges={false}>
              <View style={styles.avatarMarker}>
                <View style={styles.avatarPulse} />
                <MapAvatar stage={avatarStage} height={92} />
              </View>
            </Marker>
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
      </View>
      <View style={styles.mapHud}>
        <Text style={styles.mapHudLabel}>TODAY</Text>
        <Text style={styles.mapHudValue}>{steps.toLocaleString()}歩</Text>
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
          <Pressable
            disabled={!canFish}
            onPress={() => router.push("/(tabs)/fish")}
            style={({ pressed }) => [styles.fishButton, (!canFish || pressed) && styles.dim]}
          >
            <Text style={styles.fishButtonText}>この場所で釣る</Text>
          </Pressable>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1, minHeight: 280, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  map: { flex: 1 },
  spotCard: { gap: 12 },
  spotName: { fontSize: 18, fontWeight: "900", color: colors.ink },
  state: { fontSize: 12, fontWeight: "900", maxWidth: 105, textAlign: "right" },
  fishButton: { backgroundColor: colors.coral, padding: 12, borderRadius: 13, alignItems: "center" },
  fishButtonText: { color: colors.white, fontWeight: "900" },
  dim: { opacity: 0.45 },
  avatarMarker: { width: 104, height: 112, alignItems: "center", justifyContent: "flex-end" },
  avatarPulse: { position: "absolute", bottom: 1, width: 82, height: 26, borderRadius: 41, backgroundColor: "rgba(33,182,168,.25)", borderWidth: 2, borderColor: "rgba(33,182,168,.8)" },
  beacon: { width: 68, height: 94, alignItems: "center" },
  beaconLocked: { opacity: 0.42 },
  beaconHalo: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,.94)", borderWidth: 4, borderColor: colors.aqua, alignItems: "center", justifyContent: "center", shadowColor: colors.ocean, shadowOpacity: 0.35, shadowRadius: 8 },
  beaconSelected: { borderColor: colors.coral, transform: [{ scale: 1.12 }] },
  beaconEmoji: { fontSize: 25 },
  beaconStem: { width: 5, height: 25, backgroundColor: colors.ocean },
  beaconBase: { width: 28, height: 9, borderRadius: 10, backgroundColor: colors.aqua, borderWidth: 2, borderColor: colors.white },
  mapHud: { position: "absolute", top: 76, left: 26, backgroundColor: "rgba(6,59,76,.9)", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,255,255,.55)" },
  mapHudLabel: { color: colors.aqua, fontSize: 9, fontWeight: "900" },
  mapHudValue: { color: colors.white, fontSize: 16, fontWeight: "900" },
});
