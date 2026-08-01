import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { FISH, Habitat, SHOP } from "../constants/game";

const fishSheets: Record<Habitat, number> = {
  pond: require("../../assets/game/fish-pond-transparent.png"),
  river: require("../../assets/game/fish-river-transparent.png"),
  lake: require("../../assets/game/fish-lake-transparent.png"),
  sea: require("../../assets/game/fish-sea-transparent.png"),
};
const apparelGearSheet = require("../../assets/game/gear-apparel-sheet.png");
const tackleGearSheet = require("../../assets/game/gear-tackle-sheet.png");
const spotSheet = require("../../assets/game/fishing-spots-sheet.png");
const aquariumBackground: Record<Habitat | "deepsea", number> = {
  pond: require("../../assets/game/aquarium-pond.png"),
  river: require("../../assets/game/aquarium-river.png"),
  lake: require("../../assets/game/aquarium-lake.png"),
  sea: require("../../assets/game/aquarium-sea.png"),
  deepsea: require("../../assets/game/aquarium-deepsea.png"),
};
const anglerOutfits = [
  require("../../assets/game/angler-outfit-casual.png"),
  require("../../assets/game/angler-outfit-light.png"),
  require("../../assets/game/angler-outfit-waterproof.png"),
  require("../../assets/game/angler-outfit-storm.png"),
  require("../../assets/game/angler-outfit-sea-king.png"),
];
const ANGLER_ASPECT_RATIO = 2 / 3;

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
    <View style={locked && styles.locked}>
      <GridSprite source={fishSheets[habitat]} index={Math.max(0, index)} columns={4} rows={5} size={size} />
    </View>
  );
}

export function GearArt({ itemId, size = 64 }: { itemId: string; size?: number }) {
  const globalIndex = gearIndexes[itemId] ?? 0;
  return (
    <View style={styles.rounded}>
      <GridSprite
        source={globalIndex < 16 ? apparelGearSheet : tackleGearSheet}
        index={globalIndex % 16}
        columns={4}
        size={size}
      />
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

export function AquariumHero({ habitat = "pond", deepSea = false, height = 180, rounded = true }: {
  habitat?: Habitat;
  deepSea?: boolean;
  height?: number;
  rounded?: boolean;
}) {
  return <ImageBackground source={aquariumBackground[deepSea ? "deepsea" : habitat]} resizeMode="cover" style={[styles.aquarium, !rounded && styles.square, { height }]} />;
}

export function AnglerArt({ stage = 0, height = 155 }: { stage?: number; height?: number }) {
  const safeStage = Math.max(0, Math.min(4, stage));
  const frameWidth = height * ANGLER_ASPECT_RATIO;
  return (
    <View style={[styles.angler, { height, width: frameWidth }]}>
      <Image
        source={anglerOutfits[safeStage]}
        resizeMode="contain"
        style={{
          height,
          width: frameWidth,
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
  square: { borderRadius: 0 },
  angler: { overflow: "hidden", borderRadius: 15, backgroundColor: "#DDF6F6" },
});
