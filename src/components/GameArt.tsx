import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { FISH, Habitat, SHOP } from "../constants/game";

const fishSheets: Record<Habitat, number> = {
  pond: require("../../assets/game/fish-pond-sheet.png"),
  river: require("../../assets/game/fish-river-sheet.png"),
  lake: require("../../assets/game/fish-lake-sheet.png"),
  sea: require("../../assets/game/fish-sea-sheet.png"),
};
const gearSheet = require("../../assets/game/gear-sheet.png");
const spotSheet = require("../../assets/game/fishing-spots-sheet.png");
const aquariumBackground = require("../../assets/game/aquarium-background.png");
const anglerOutfits = require("../../assets/game/angler-outfits.png");

const fishIndexes = Object.fromEntries(FISH.map((fish, index) => [fish.id, index]));
const gearIndexes = Object.fromEntries(SHOP.map((item, index) => [item.id, index]));
const habitatIndexes: Record<Habitat, number> = { pond: 0, river: 1, lake: 2, sea: 3 };

function GridSprite({ source, index, columns, rows = columns, size }: {
  source: number;
  index: number;
  columns: number;
  rows?: number;
  size: number;
}) {
  const row = Math.floor(index / columns);
  const column = index % columns;
  return (
    <View style={{ width: size, height: size, overflow: "hidden" }}>
      <Image
        source={source}
        resizeMode="stretch"
        style={{
          position: "absolute",
          width: size * columns,
          height: size * rows,
          left: -column * size,
          top: -row * size,
        }}
      />
    </View>
  );
}

export function FishArt({ fishId, size = 72, locked = false }: {
  fishId: string;
  size?: number;
  locked?: boolean;
}) {
  const globalIndex = fishIndexes[fishId] ?? 0;
  const fish = FISH[globalIndex] ?? FISH[0];
  const habitat = fish.habitats[0];
  const habitatFish = FISH.filter((entry) => entry.habitats[0] === habitat);
  const index = habitatFish.findIndex((entry) => entry.id === fishId);
  return (
    <View style={[styles.rounded, locked && styles.locked]}>
      <GridSprite source={fishSheets[habitat]} index={Math.max(0, index)} columns={4} rows={5} size={size} />
    </View>
  );
}

export function GearArt({ itemId, size = 64 }: { itemId: string; size?: number }) {
  return (
    <View style={styles.rounded}>
      <GridSprite source={gearSheet} index={gearIndexes[itemId] ?? 0} columns={4} size={size} />
    </View>
  );
}

export function FishingSpotArt({ habitat, height = 150 }: { habitat: Habitat; height?: number }) {
  const index = habitatIndexes[habitat];
  return (
    <ResponsiveCrop source={spotSheet} index={index} columns={2} height={height} />
  );
}

function ResponsiveCrop({ source, index, columns, height }: {
  source: number;
  index: number;
  columns: number;
  height: number;
}) {
  return (
    <View style={[styles.crop, { height }]}>
      <Image
        source={source}
        resizeMode="cover"
        style={{
          position: "absolute",
          width: "200%",
          height: height * columns,
          left: `${-(index % columns) * 100}%`,
          top: -Math.floor(index / columns) * height,
        }}
      />
    </View>
  );
}

export function AquariumHero({ height = 180 }: { height?: number }) {
  return <ImageBackground source={aquariumBackground} resizeMode="cover" style={[styles.aquarium, { height }]} />;
}

export function AnglerArt({ stage = 0, height = 155 }: { stage?: number; height?: number }) {
  const safeStage = Math.max(0, Math.min(3, stage));
  return (
    <View style={[styles.angler, { height, width: height * 0.72 }]}>
      <Image
        source={anglerOutfits}
        resizeMode="stretch"
        style={{
          position: "absolute",
          height,
          width: height * 0.72 * 4,
          left: -safeStage * height * 0.72,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rounded: { borderRadius: 14, overflow: "hidden" },
  locked: { opacity: 0.22 },
  crop: { width: "100%", borderRadius: 16, overflow: "hidden", backgroundColor: "#DDF6F6" },
  aquarium: { width: "100%", borderRadius: 18, overflow: "hidden" },
  angler: { overflow: "hidden", borderRadius: 15, backgroundColor: "#DDF6F6" },
});
