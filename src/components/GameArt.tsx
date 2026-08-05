import { Image, StyleSheet, View } from "react-native";
import { FISH, Habitat, SHOP } from "../constants/game";

const fishSheets: Record<Habitat, number> = {
  pond: require("../../assets/game/fish-pond-transparent.png"),
  river: require("../../assets/game/fish-river-transparent.png"),
  lake: require("../../assets/game/fish-lake-transparent.png"),
  sea: require("../../assets/game/fish-sea-transparent.png"),
};
const extraFishSheets: Record<Habitat, number> = {
  pond: require("../../assets/game/fish-pond-extra-transparent.png"),
  river: require("../../assets/game/fish-river-extra-transparent.png"),
  lake: require("../../assets/game/fish-lake-extra-transparent.png"),
  sea: require("../../assets/game/fish-sea-extra-transparent.png"),
};
const extraFishGrid: Record<Habitat, { columns: number; rows: number }> = {
  pond: { columns: 5, rows: 6 },
  river: { columns: 5, rows: 6 },
  lake: { columns: 5, rows: 4 },
  sea: { columns: 5, rows: 4 },
};
const prefectureSheets: Record<string, number> = {
  hokkaido:require("../../assets/game/prefectures/hokkaido.png"), aomori:require("../../assets/game/prefectures/aomori.png"), iwate:require("../../assets/game/prefectures/iwate.png"), miyagi:require("../../assets/game/prefectures/miyagi.png"), akita:require("../../assets/game/prefectures/akita.png"),
  yamagata:require("../../assets/game/prefectures/yamagata.png"), fukushima:require("../../assets/game/prefectures/fukushima.png"), ibaraki:require("../../assets/game/prefectures/ibaraki.png"), tochigi:require("../../assets/game/prefectures/tochigi.png"), gunma:require("../../assets/game/prefectures/gunma.png"),
  saitama:require("../../assets/game/prefectures/saitama.png"), chiba:require("../../assets/game/prefectures/chiba.png"), tokyo:require("../../assets/game/prefectures/tokyo.png"), kanagawa:require("../../assets/game/prefectures/kanagawa.png"), niigata:require("../../assets/game/prefectures/niigata.png"),
  toyama:require("../../assets/game/prefectures/toyama.png"), ishikawa:require("../../assets/game/prefectures/ishikawa.png"), fukui:require("../../assets/game/prefectures/fukui.png"), yamanashi:require("../../assets/game/prefectures/yamanashi.png"), nagano:require("../../assets/game/prefectures/nagano.png"),
  gifu:require("../../assets/game/prefectures/gifu.png"), shizuoka:require("../../assets/game/prefectures/shizuoka.png"), aichi:require("../../assets/game/prefectures/aichi.png"), mie:require("../../assets/game/prefectures/mie.png"), shiga:require("../../assets/game/prefectures/shiga.png"),
  kyoto:require("../../assets/game/prefectures/kyoto.png"), osaka:require("../../assets/game/prefectures/osaka.png"), hyogo:require("../../assets/game/prefectures/hyogo.png"), nara:require("../../assets/game/prefectures/nara.png"), wakayama:require("../../assets/game/prefectures/wakayama.png"),
  tottori:require("../../assets/game/prefectures/tottori.png"), shimane:require("../../assets/game/prefectures/shimane.png"), okayama:require("../../assets/game/prefectures/okayama.png"), hiroshima:require("../../assets/game/prefectures/hiroshima.png"), yamaguchi:require("../../assets/game/prefectures/yamaguchi.png"),
  tokushima:require("../../assets/game/prefectures/tokushima.png"), kagawa:require("../../assets/game/prefectures/kagawa.png"), ehime:require("../../assets/game/prefectures/ehime.png"), kochi:require("../../assets/game/prefectures/kochi.png"), fukuoka:require("../../assets/game/prefectures/fukuoka.png"),
  saga:require("../../assets/game/prefectures/saga.png"), nagasaki:require("../../assets/game/prefectures/nagasaki.png"), kumamoto:require("../../assets/game/prefectures/kumamoto.png"), oita:require("../../assets/game/prefectures/oita.png"), miyazaki:require("../../assets/game/prefectures/miyazaki.png"),
  kagoshima:require("../../assets/game/prefectures/kagoshima.png"), okinawa:require("../../assets/game/prefectures/okinawa.png"),
};
const prefectureBosses: Record<string, number> = {
  hokkaido:require("../../assets/game/prefecture-bosses/hokkaido.png"), aomori:require("../../assets/game/prefecture-bosses/aomori.png"), iwate:require("../../assets/game/prefecture-bosses/iwate.png"), miyagi:require("../../assets/game/prefecture-bosses/miyagi.png"), akita:require("../../assets/game/prefecture-bosses/akita.png"),
  yamagata:require("../../assets/game/prefecture-bosses/yamagata.png"), fukushima:require("../../assets/game/prefecture-bosses/fukushima.png"), ibaraki:require("../../assets/game/prefecture-bosses/ibaraki.png"), tochigi:require("../../assets/game/prefecture-bosses/tochigi.png"), gunma:require("../../assets/game/prefecture-bosses/gunma.png"),
  saitama:require("../../assets/game/prefecture-bosses/saitama.png"), chiba:require("../../assets/game/prefecture-bosses/chiba.png"), tokyo:require("../../assets/game/prefecture-bosses/tokyo.png"), kanagawa:require("../../assets/game/prefecture-bosses/kanagawa.png"), niigata:require("../../assets/game/prefecture-bosses/niigata.png"),
  toyama:require("../../assets/game/prefecture-bosses/toyama.png"), ishikawa:require("../../assets/game/prefecture-bosses/ishikawa.png"), fukui:require("../../assets/game/prefecture-bosses/fukui.png"), yamanashi:require("../../assets/game/prefecture-bosses/yamanashi.png"), nagano:require("../../assets/game/prefecture-bosses/nagano.png"),
  gifu:require("../../assets/game/prefecture-bosses/gifu.png"), shizuoka:require("../../assets/game/prefecture-bosses/shizuoka.png"), aichi:require("../../assets/game/prefecture-bosses/aichi.png"), mie:require("../../assets/game/prefecture-bosses/mie.png"), shiga:require("../../assets/game/prefecture-bosses/shiga.png"),
  kyoto:require("../../assets/game/prefecture-bosses/kyoto.png"), osaka:require("../../assets/game/prefecture-bosses/osaka.png"), hyogo:require("../../assets/game/prefecture-bosses/hyogo.png"), nara:require("../../assets/game/prefecture-bosses/nara.png"), wakayama:require("../../assets/game/prefecture-bosses/wakayama.png"),
  tottori:require("../../assets/game/prefecture-bosses/tottori.png"), shimane:require("../../assets/game/prefecture-bosses/shimane.png"), okayama:require("../../assets/game/prefecture-bosses/okayama.png"), hiroshima:require("../../assets/game/prefecture-bosses/hiroshima.png"), yamaguchi:require("../../assets/game/prefecture-bosses/yamaguchi.png"),
  tokushima:require("../../assets/game/prefecture-bosses/tokushima.png"), kagawa:require("../../assets/game/prefecture-bosses/kagawa.png"), ehime:require("../../assets/game/prefecture-bosses/ehime.png"), kochi:require("../../assets/game/prefecture-bosses/kochi.png"), fukuoka:require("../../assets/game/prefecture-bosses/fukuoka.png"),
  saga:require("../../assets/game/prefecture-bosses/saga.png"), nagasaki:require("../../assets/game/prefecture-bosses/nagasaki.png"), kumamoto:require("../../assets/game/prefecture-bosses/kumamoto.png"), oita:require("../../assets/game/prefecture-bosses/oita.png"), miyazaki:require("../../assets/game/prefecture-bosses/miyazaki.png"),
  kagoshima:require("../../assets/game/prefecture-bosses/kagoshima.png"), okinawa:require("../../assets/game/prefecture-bosses/okinawa.png"),
};
const apparelGearSheet = require("../../assets/game/gear-apparel-sheet.png");
const tackleGearSheet = require("../../assets/game/gear-tackle-sheet.png");
const spotSheet = require("../../assets/game/fishing-spots-sheet.png");
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

function PrefectureSprite({ source, index, size }: { source: number; index: number; size: number }) {
  const resolved = Image.resolveAssetSource(source);
  const cellAspect = (resolved.width * 2) / Math.max(1, resolved.height * 5);
  const frameSize = size;
  const cellWidth = cellAspect >= 1 ? frameSize : frameSize * cellAspect;
  const cellHeight = cellAspect >= 1 ? frameSize / cellAspect : frameSize;
  const column = index % 5;
  const row = Math.floor(index / 5);
  return <View style={{ width:size, height:size, overflow:"hidden", alignItems:"center", justifyContent:"center" }}>
    <View style={{ width:frameSize, height:frameSize, overflow:"hidden" }}>
      <Image source={source} resizeMode="stretch" style={{ position:"absolute", width:cellWidth*5, height:cellHeight*2, left:(frameSize-cellWidth)/2-column*cellWidth, top:(frameSize-cellHeight)/2-row*cellHeight }} />
    </View>
  </View>;
}

export function FishArt({ fishId, size = 72, locked = false }: {
  fishId: string;
  size?: number;
  locked?: boolean;
}) {
  const globalIndex = fishIndexes[fishId] ?? 0;
  const fish = FISH[globalIndex] ?? FISH[0];
  if (fish.prefectureSlug) {
    if (fish.rank === "SSS") {
      return <View style={[{ width:size, height:size, alignItems:"center", justifyContent:"center", overflow:"hidden" }, locked && styles.locked]}><Image source={prefectureBosses[fish.prefectureSlug]} resizeMode="contain" style={{ width:size*.9, height:size*.9 }} /></View>;
    }
    const prefectureFish = FISH.filter((entry) => entry.prefectureSlug === fish.prefectureSlug);
    const prefectureIndex = Math.max(0, prefectureFish.findIndex((entry) => entry.id === fishId));
    return <View style={locked && styles.locked}><PrefectureSprite source={prefectureSheets[fish.prefectureSlug]} index={prefectureIndex} size={size} /></View>;
  }
  const habitat = fish.habitats[0];
  const habitatFish = FISH.filter((entry) => entry.habitats[0] === habitat);
  const grid = extraFishGrid[habitat];
  const generatedArtCount = grid.columns * grid.rows;
  const foundIndex = habitatFish.findIndex((entry) => entry.id === fishId);
  const generatedIndex = [...fishId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % (20 + generatedArtCount);
  const index = fishId.startsWith("jp_") ? generatedIndex : foundIndex;
  const isExtra = index >= 20;
  return (
    <View style={locked && styles.locked}>
      <GridSprite
        source={isExtra ? extraFishSheets[habitat] : fishSheets[habitat]}
        index={Math.max(0, isExtra ? index - 20 : index)}
        columns={isExtra ? grid.columns : 4}
        rows={isExtra ? grid.rows : 5}
        size={size}
      />
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
  angler: { overflow: "hidden", borderRadius: 15, backgroundColor: "#DDF6F6" },
});
