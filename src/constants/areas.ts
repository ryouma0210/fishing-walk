import { Habitat } from "./game";

export type FishingArea = {
  id: string;
  name: string;
  subtitle: string;
  habitat: Habitat;
  emoji: string;
  bossFishId: string;
  bossName: string;
  node: { left: `${number}%`; top: `${number}%` };
};

export const FISHING_AREAS: FishingArea[] = [
  {
    id: "lotus_pond", name: "はじまりの蓮池", subtitle: "穏やかな池と水辺の生き物", habitat: "pond", emoji: "🌿",
    bossFishId: "pond_guardian", bossName: "蒼池のヌシ", node: { left: "53%", top: "60%" },
  },
  {
    id: "clear_river", name: "きらめき清流", subtitle: "滝から続く急流のエリア", habitat: "river", emoji: "🏞️",
    bossFishId: "river_colossus", bossName: "大河のガンリュウ", node: { left: "67%", top: "45%" },
  },
  {
    id: "azure_lake", name: "蒼天の大湖", subtitle: "山々に囲まれた深い湖", habitat: "lake", emoji: "🏔️",
    bossFishId: "lake_serpent", bossName: "蒼湖の大蛇", node: { left: "72%", top: "29%" },
  },
  {
    id: "ocean_cape", name: "さいはての海岬", subtitle: "伝説が眠る大洋と深海", habitat: "sea", emoji: "🌊",
    bossFishId: "sea_leviathan", bossName: "リヴァイアサン", node: { left: "27%", top: "13%" },
  },
];
