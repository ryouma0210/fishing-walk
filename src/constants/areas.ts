import { Habitat } from "./game";

export type FishingArea = {
  id: string;
  name: string;
  subtitle: string;
  habitat: Habitat;
  emoji: string;
  bossFishId: string;
  bossName: string;
  chapter: 1 | 2;
  node: { left: `${number}%`; top: `${number}%` };
};

export const FISHING_AREAS: FishingArea[] = [
  {
    id: "lotus_pond", name: "はじまりの蓮池", subtitle: "穏やかな池と水辺の生き物", habitat: "pond", emoji: "🌿",
    bossFishId: "pond_guardian", bossName: "蒼池のヌシ", chapter: 1, node: { left: "53%", top: "80%" },
  },
  {
    id: "clear_river", name: "きらめき清流", subtitle: "滝から続く急流のエリア", habitat: "river", emoji: "🏞️",
    bossFishId: "river_colossus", bossName: "大河のガンリュウ", chapter: 1, node: { left: "61%", top: "60%" },
  },
  {
    id: "azure_lake", name: "蒼天の大湖", subtitle: "山々に囲まれた深い湖", habitat: "lake", emoji: "🏔️",
    bossFishId: "lake_serpent", bossName: "蒼湖の大蛇", chapter: 1, node: { left: "73%", top: "40%" },
  },
  {
    id: "ocean_cape", name: "さいはての海岬", subtitle: "伝説が眠る大洋と深海", habitat: "sea", emoji: "🌊",
    bossFishId: "sea_leviathan", bossName: "リヴァイアサン", chapter: 1, node: { left: "27%", top: "22%" },
  },
  {
    id: "ancient_marsh", name: "幻光の古代湿原", subtitle: "古代遺跡が沈む光の湿原", habitat: "pond", emoji: "🪷",
    bossFishId: "pond_ancient_turtle", bossName: "千年亀", chapter: 2, node: { left: "54%", top: "80%" },
  },
  {
    id: "thunder_canyon", name: "雷鳴の峡谷", subtitle: "雷雲と断崖に囲まれた激流", habitat: "river", emoji: "⚡",
    bossFishId: "river_dragon", bossName: "龍鱗の主", chapter: 2, node: { left: "43%", top: "60%" },
  },
  {
    id: "moon_crater_lake", name: "月影の天輪湖", subtitle: "天空の月を映す巨大な湖", habitat: "lake", emoji: "🌙",
    bossFishId: "lake_guardian", bossName: "湖のヌシ", chapter: 2, node: { left: "64%", top: "40%" },
  },
  {
    id: "polar_abyss", name: "極夜の深淵海", subtitle: "氷海の底に続く最終エリア", habitat: "sea", emoji: "❄️",
    bossFishId: "sea_abyss_dragon", bossName: "深淵の龍魚", chapter: 2, node: { left: "43%", top: "22%" },
  },
];
