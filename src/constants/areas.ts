import { Habitat, RANKS } from "./game";
import { ALL_AREA_SEEDS } from "./expansionData";

export type FishingArea = {
  id: string;
  name: string;
  subtitle: string;
  habitat: Habitat;
  emoji: string;
  bossFishId: string;
  bossName: string;
  fishIds: string[];
  productFishIds: string[];
  requiredSteps: number;
  chapter: number;
  story: "japan" | "world" | "space";
  node: { left: `${number}%`; top: `${number}%` };
};

export const FISHING_AREAS: FishingArea[] = ALL_AREA_SEEDS.map((prefecture, index) => ({
  id: `jp_${prefecture.slug}`,
  name: prefecture.name,
  subtitle: `${prefecture.name}の魚8種と名産物2種`,
  habitat: prefecture.habitat,
  emoji: "🎣",
  bossFishId: `jp_${prefecture.slug}_sss`,
  bossName: `${prefecture.name}のヌシ`,
  fishIds: [
    ...RANKS.map((rank) => `jp_${prefecture.slug}_${rank.toLowerCase()}`),
    `jp_${prefecture.slug}_special_1`,
    `jp_${prefecture.slug}_special_2`,
  ],
  productFishIds: [`jp_${prefecture.slug}_special_1`, `jp_${prefecture.slug}_special_2`],
  requiredSteps: prefecture.chapter === "japan" ? index * 50000 : prefecture.chapter === "world" ? (index - 47) * 50000 : (index - 97) * 50000,
  chapter: prefecture.chapter === "japan" ? 1 : prefecture.chapter === "world" ? 2 : 3,
  story: prefecture.chapter,
  node: { left: `${[28, 52, 72, 46][index % 4]}%`, top: `${20 + index % 8 * 10}%` },
}));
