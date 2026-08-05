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
  world_south_korea:require("../../assets/game/world/south_korea.png"),
  world_china:require("../../assets/game/world/china.png"),
  world_mongolia:require("../../assets/game/world/mongolia.png"),
  world_taiwan:require("../../assets/game/world/taiwan.png"),
  world_philippines:require("../../assets/game/world/philippines.png"),
  world_vietnam:require("../../assets/game/world/vietnam.png"),
  world_thailand:require("../../assets/game/world/thailand.png"),
  world_cambodia:require("../../assets/game/world/cambodia.png"),
  world_malaysia:require("../../assets/game/world/malaysia.png"),
  world_singapore:require("../../assets/game/world/singapore.png"),
  world_indonesia:require("../../assets/game/world/indonesia.png"),
  world_india:require("../../assets/game/world/india.png"),
  world_nepal:require("../../assets/game/world/nepal.png"),
  world_sri_lanka:require("../../assets/game/world/sri_lanka.png"),
  world_uae:require("../../assets/game/world/uae.png"),
  world_turkey:require("../../assets/game/world/turkey.png"),
  world_greece:require("../../assets/game/world/greece.png"),
  world_italy:require("../../assets/game/world/italy.png"),
  world_spain:require("../../assets/game/world/spain.png"),
  world_portugal:require("../../assets/game/world/portugal.png"),
  world_france:require("../../assets/game/world/france.png"),
  world_united_kingdom:require("../../assets/game/world/united_kingdom.png"),
  world_ireland:require("../../assets/game/world/ireland.png"),
  world_netherlands:require("../../assets/game/world/netherlands.png"),
  world_belgium:require("../../assets/game/world/belgium.png"),
  world_germany:require("../../assets/game/world/germany.png"),
  world_switzerland:require("../../assets/game/world/switzerland.png"),
  world_austria:require("../../assets/game/world/austria.png"),
  world_czechia:require("../../assets/game/world/czechia.png"),
  world_poland:require("../../assets/game/world/poland.png"),
  world_denmark:require("../../assets/game/world/denmark.png"),
  world_norway:require("../../assets/game/world/norway.png"),
  world_sweden:require("../../assets/game/world/sweden.png"),
  world_finland:require("../../assets/game/world/finland.png"),
  world_iceland:require("../../assets/game/world/iceland.png"),
  world_egypt:require("../../assets/game/world/egypt.png"),
  world_morocco:require("../../assets/game/world/morocco.png"),
  world_kenya:require("../../assets/game/world/kenya.png"),
  world_tanzania:require("../../assets/game/world/tanzania.png"),
  world_south_africa:require("../../assets/game/world/south_africa.png"),
  world_canada:require("../../assets/game/world/canada.png"),
  world_united_states:require("../../assets/game/world/united_states.png"),
  world_mexico:require("../../assets/game/world/mexico.png"),
  world_peru:require("../../assets/game/world/peru.png"),
  world_brazil:require("../../assets/game/world/brazil.png"),
  world_argentina:require("../../assets/game/world/argentina.png"),
  world_chile:require("../../assets/game/world/chile.png"),
  world_australia:require("../../assets/game/world/australia.png"),
  world_new_zealand:require("../../assets/game/world/new_zealand.png"),
  world_antarctica:require("../../assets/game/world/antarctica.png"),
  space_moon:require("../../assets/game/space/moon.png"),
  space_lunar_ice:require("../../assets/game/space/lunar_ice.png"),
  space_mercury:require("../../assets/game/space/mercury.png"),
  space_venus_cloud:require("../../assets/game/space/venus_cloud.png"),
  space_venus_night:require("../../assets/game/space/venus_night.png"),
  space_mars_canal:require("../../assets/game/space/mars_canal.png"),
  space_mars_pole:require("../../assets/game/space/mars_pole.png"),
  space_phobos:require("../../assets/game/space/phobos.png"),
  space_deimos:require("../../assets/game/space/deimos.png"),
  space_asteroid_belt:require("../../assets/game/space/asteroid_belt.png"),
  space_ceres:require("../../assets/game/space/ceres.png"),
  space_vesta:require("../../assets/game/space/vesta.png"),
  space_jupiter_cloud:require("../../assets/game/space/jupiter_cloud.png"),
  space_great_red_spot:require("../../assets/game/space/great_red_spot.png"),
  space_io:require("../../assets/game/space/io.png"),
  space_europa:require("../../assets/game/space/europa.png"),
  space_ganymede:require("../../assets/game/space/ganymede.png"),
  space_callisto:require("../../assets/game/space/callisto.png"),
  space_saturn_ring:require("../../assets/game/space/saturn_ring.png"),
  space_titan:require("../../assets/game/space/titan.png"),
  space_enceladus:require("../../assets/game/space/enceladus.png"),
  space_mimas:require("../../assets/game/space/mimas.png"),
  space_uranus:require("../../assets/game/space/uranus.png"),
  space_titania:require("../../assets/game/space/titania.png"),
  space_neptune:require("../../assets/game/space/neptune.png"),
  space_triton:require("../../assets/game/space/triton.png"),
  space_pluto:require("../../assets/game/space/pluto.png"),
  space_charon:require("../../assets/game/space/charon.png"),
  space_kuiper:require("../../assets/game/space/kuiper.png"),
  space_comet:require("../../assets/game/space/comet.png"),
  space_solar_wind:require("../../assets/game/space/solar_wind.png"),
  space_solar_corona:require("../../assets/game/space/solar_corona.png"),
  space_alpha_centauri:require("../../assets/game/space/alpha_centauri.png"),
  space_proxima_b:require("../../assets/game/space/proxima_b.png"),
  space_sirius:require("../../assets/game/space/sirius.png"),
  space_vega:require("../../assets/game/space/vega.png"),
  space_betelgeuse:require("../../assets/game/space/betelgeuse.png"),
  space_pleiades:require("../../assets/game/space/pleiades.png"),
  space_orion:require("../../assets/game/space/orion.png"),
  space_horsehead:require("../../assets/game/space/horsehead.png"),
  space_andromeda:require("../../assets/game/space/andromeda.png"),
  space_magellanic:require("../../assets/game/space/magellanic.png"),
  space_supernova:require("../../assets/game/space/supernova.png"),
  space_neutron_star:require("../../assets/game/space/neutron_star.png"),
  space_black_hole:require("../../assets/game/space/black_hole.png"),
  space_wormhole:require("../../assets/game/space/wormhole.png"),
  space_dark_matter:require("../../assets/game/space/dark_matter.png"),
  space_cosmic_web:require("../../assets/game/space/cosmic_web.png"),
  space_edge_universe:require("../../assets/game/space/edge_universe.png"),
  space_origin_ocean:require("../../assets/game/space/origin_ocean.png"),
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
    if (fish.rank === "SSS" && prefectureBosses[fish.prefectureSlug]) {
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
