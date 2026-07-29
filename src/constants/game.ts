export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";
export type Habitat = "pond" | "river" | "lake" | "sea";
export type GearKind = "hat" | "top" | "bottom" | "shoes" | "rod" | "bait" | "cooler";
export type GearEffect = "luck" | "fight" | "coins" | "steps" | "rod" | "bait" | "size";

export type Fish = {
  id: string;
  name: string;
  emoji: string;
  rank: Rank;
  minCm: number;
  maxCm: number;
  habitats: Habitat[];
  aquarium: string;
  description: string;
};

export type ShopItem = {
  id: string;
  name: string;
  emoji: string;
  kind: GearKind;
  cost: number;
  effect: GearEffect;
  power: number;
  description: string;
};

export type FishingSpot = {
  id: string;
  name: string;
  habitat: Habitat;
  emoji: string;
  latitude: number;
  longitude: number;
  unlockSteps: number;
};

export const RANKS: Rank[] = ["E", "D", "C", "B", "A", "S", "SS", "SSS"];
export const RANK_INDEX = Object.fromEntries(RANKS.map((rank, index) => [rank, index])) as Record<Rank, number>;
export const HABITAT_NAMES: Record<Habitat, string> = {
  pond: "池・公園",
  river: "川",
  lake: "湖",
  sea: "海",
};

export const FISH: Fish[] = [
  { id:"medaka",name:"メダカ",emoji:"🐟",rank:"E",minCm:2,maxCm:4,habitats:["pond"],aquarium:"小さな淡水館",description:"群れで泳ぐ小さな魚。最初の一匹にぴったり。" },
  { id:"goldfish",name:"キンギョ",emoji:"🐠",rank:"E",minCm:5,maxCm:18,habitats:["pond"],aquarium:"小さな淡水館",description:"鮮やかな尾びれを揺らす人気者。" },
  { id:"crayfish",name:"アメリカザリガニ",emoji:"🦞",rank:"E",minCm:6,maxCm:13,habitats:["pond","river"],aquarium:"水辺の生き物館",description:"水草の影に隠れる赤いハサミの持ち主。" },
  { id:"goby",name:"ハゼ",emoji:"🐟",rank:"E",minCm:7,maxCm:22,habitats:["river","sea"],aquarium:"小さな淡水館",description:"川と海を行き来する底魚。" },
  { id:"bluegill",name:"ブルーギル",emoji:"🐠",rank:"D",minCm:12,maxCm:30,habitats:["pond","lake"],aquarium:"湖沼館",description:"丸い体と青いエラが特徴。" },
  { id:"carp",name:"コイ",emoji:"🐟",rank:"D",minCm:25,maxCm:75,habitats:["pond","river","lake"],aquarium:"大河館",description:"身近な水辺に潜む力持ち。" },
  { id:"ayu",name:"アユ",emoji:"🐟",rank:"D",minCm:15,maxCm:32,habitats:["river"],aquarium:"清流館",description:"香魚とも呼ばれる清流の魚。" },
  { id:"sardine",name:"マイワシ",emoji:"🐟",rank:"D",minCm:12,maxCm:28,habitats:["sea"],aquarium:"近海館",description:"銀色の大群で海を渡る。" },
  { id:"trout",name:"ニジマス",emoji:"🐟",rank:"C",minCm:25,maxCm:65,habitats:["river","lake"],aquarium:"清流館",description:"虹色の帯を持つ美しい魚。" },
  { id:"eel",name:"ウナギ",emoji:"🐍",rank:"C",minCm:35,maxCm:110,habitats:["river"],aquarium:"夜行館",description:"夜の川底を進む細長い魚。" },
  { id:"mackerel",name:"マサバ",emoji:"🐟",rank:"C",minCm:20,maxCm:50,habitats:["sea"],aquarium:"近海館",description:"青い背の模様が美しい回遊魚。" },
  { id:"octopus",name:"マダコ",emoji:"🐙",rank:"C",minCm:30,maxCm:90,habitats:["sea"],aquarium:"水辺の生き物館",description:"岩場で待ち構える八本足の知恵者。" },
  { id:"bass",name:"ブラックバス",emoji:"🐠",rank:"B",minCm:30,maxCm:75,habitats:["pond","lake"],aquarium:"湖沼館",description:"強い引きで釣り人を魅了する。" },
  { id:"catfish",name:"ナマズ",emoji:"🐟",rank:"B",minCm:40,maxCm:130,habitats:["river","lake"],aquarium:"夜行館",description:"長いヒゲで暗い水底を探る。" },
  { id:"squid",name:"アオリイカ",emoji:"🦑",rank:"B",minCm:20,maxCm:55,habitats:["sea"],aquarium:"近海館",description:"透明なひれを波打たせる海のハンター。" },
  { id:"seaBream",name:"マダイ",emoji:"🐠",rank:"B",minCm:30,maxCm:100,habitats:["sea"],aquarium:"近海館",description:"祝い魚として愛される海の王道。" },
  { id:"salmon",name:"サケ",emoji:"🐟",rank:"A",minCm:55,maxCm:105,habitats:["river","sea"],aquarium:"回遊魚館",description:"生まれた川へ帰る長距離ランナー。" },
  { id:"sturgeon",name:"チョウザメ",emoji:"🐟",rank:"A",minCm:80,maxCm:250,habitats:["river","lake"],aquarium:"古代魚館",description:"太古から姿を変えない重厚な魚。" },
  { id:"yellowtail",name:"ブリ",emoji:"🐟",rank:"A",minCm:60,maxCm:150,habitats:["sea"],aquarium:"回遊魚館",description:"成長で名前が変わる出世魚。" },
  { id:"alligatorGar",name:"アリゲーターガー",emoji:"🐊",rank:"A",minCm:100,maxCm:280,habitats:["lake"],aquarium:"怪魚館",description:"鎧のような鱗と長い口を持つ。" },
  { id:"giantCarp",name:"黄金の大鯉",emoji:"✨",rank:"S",minCm:80,maxCm:180,habitats:["pond","river"],aquarium:"幻魚館",description:"長く歩いた者の前に現れる黄金の主。" },
  { id:"tuna",name:"クロマグロ",emoji:"🐟",rank:"S",minCm:90,maxCm:300,habitats:["sea"],aquarium:"大洋館",description:"外洋を高速で泳ぎ続ける巨体。" },
  { id:"giantCatfish",name:"メコンオオナマズ",emoji:"🐋",rank:"S",minCm:150,maxCm:300,habitats:["river"],aquarium:"怪魚館",description:"大河に棲む伝説級の巨大魚。" },
  { id:"coelacanth",name:"シーラカンス",emoji:"🦴",rank:"S",minCm:120,maxCm:220,habitats:["sea"],aquarium:"古代魚館",description:"深海から現れる生きた化石。" },
  { id:"arapaima",name:"ピラルク",emoji:"🐉",rank:"SS",minCm:160,maxCm:350,habitats:["lake"],aquarium:"怪魚館",description:"水面で空気を吸う世界最大級の淡水魚。" },
  { id:"oarfish",name:"リュウグウノツカイ",emoji:"🎗️",rank:"SS",minCm:300,maxCm:900,habitats:["sea"],aquarium:"深海館",description:"銀色の長い体を持つ深海の使者。" },
  { id:"giantSquid",name:"ダイオウイカ",emoji:"🦑",rank:"SS",minCm:500,maxCm:1300,habitats:["sea"],aquarium:"深海館",description:"深海に潜む巨大な十本足。" },
  { id:"lakeGuardian",name:"湖のヌシ",emoji:"🌌",rank:"SS",minCm:200,maxCm:500,habitats:["lake"],aquarium:"幻魚館",description:"星明かりの夜だけ湖面へ現れる。" },
  { id:"whaleShark",name:"ジンベエザメ",emoji:"🦈",rank:"SSS",minCm:500,maxCm:1200,habitats:["sea"],aquarium:"伝説館",description:"星模様をまとった世界最大の魚。" },
  { id:"riverDragon",name:"龍鱗の主",emoji:"🐲",rank:"SSS",minCm:300,maxCm:800,habitats:["river"],aquarium:"伝説館",description:"清流を守る龍の鱗を持つ幻の主。" },
  { id:"leviathan",name:"リヴァイアサン",emoji:"🐉",rank:"SSS",minCm:800,maxCm:2000,habitats:["sea"],aquarium:"伝説館",description:"大洋の底に眠る究極の大物。" },
  { id:"ancientTurtle",name:"千年亀",emoji:"🐢",rank:"SSS",minCm:180,maxCm:450,habitats:["pond","lake"],aquarium:"伝説館",description:"千年分の水辺の記憶を背負う生き物。" },
];

export const SHOP: ShopItem[] = [
  {id:"cap",name:"潮風キャップ",emoji:"🧢",kind:"hat",cost:80,effect:"luck",power:1,description:"レア抽選 +1"},
  {id:"anglerHat",name:"アングラーハット",emoji:"👒",kind:"hat",cost:450,effect:"luck",power:3,description:"レア抽選 +3"},
  {id:"legendCrown",name:"海王の帽子",emoji:"👑",kind:"hat",cost:1800,effect:"luck",power:6,description:"レア抽選 +6"},
  {id:"jacket",name:"防水ジャケット",emoji:"🧥",kind:"top",cost:120,effect:"fight",power:1,description:"ファイト成功率 +4%"},
  {id:"stormJacket",name:"ストームジャケット",emoji:"🥋",kind:"top",cost:650,effect:"fight",power:4,description:"ファイト成功率 +16%"},
  {id:"pants",name:"アングラーパンツ",emoji:"👖",kind:"bottom",cost:100,effect:"coins",power:1,description:"獲得コイン +10%"},
  {id:"treasurePants",name:"財宝パンツ",emoji:"🩳",kind:"bottom",cost:700,effect:"coins",power:4,description:"獲得コイン +40%"},
  {id:"boots",name:"磯ブーツ",emoji:"🥾",kind:"shoes",cost:90,effect:"steps",power:1,description:"歩数効果 +10%"},
  {id:"trailShoes",name:"トレイルシューズ",emoji:"👟",kind:"shoes",cost:500,effect:"steps",power:3,description:"歩数効果 +30%"},
  {id:"rod2",name:"カーボンロッド",emoji:"🎣",kind:"rod",cost:250,effect:"rod",power:2,description:"Aランクまで安定"},
  {id:"rod3",name:"チタンロッド",emoji:"🎣",kind:"rod",cost:900,effect:"rod",power:4,description:"SSランクへ挑戦"},
  {id:"rod4",name:"マスターロッド",emoji:"⚡",kind:"rod",cost:2600,effect:"rod",power:7,description:"SSSランクへ挑戦"},
  {id:"bait2",name:"プレミアム餌",emoji:"🪱",kind:"bait",cost:150,effect:"bait",power:2,description:"高ランク出現率アップ"},
  {id:"bait3",name:"幻光ルアー",emoji:"💎",kind:"bait",cost:750,effect:"bait",power:5,description:"幻魚を強く引き寄せる"},
  {id:"cooler2",name:"大型クーラー",emoji:"🧊",kind:"cooler",cost:300,effect:"size",power:2,description:"大物サイズ率アップ"},
  {id:"cooler3",name:"極寒クーラー",emoji:"❄️",kind:"cooler",cost:1200,effect:"size",power:5,description:"自己ベスト率大幅アップ"},
];

export const DEFAULT_GEAR: Record<GearKind, string> = {
  hat: "なし",
  top: "普段着",
  bottom: "普段のズボン",
  shoes: "スニーカー",
  rod: "ビギナーロッド",
  bait: "ふつうの餌",
  cooler: "小型クーラー",
};

export function createFishingSpots(latitude: number, longitude: number): FishingSpot[] {
  return [
    { id:"pond-local",name:"みずべ公園",habitat:"pond",emoji:"🌿",latitude:latitude+0.0018,longitude:longitude+0.0012,unlockSteps:0 },
    { id:"river-local",name:"ウォーク川",habitat:"river",emoji:"🏞️",latitude:latitude-0.0032,longitude:longitude+0.0026,unlockSteps:1500 },
    { id:"lake-local",name:"青空湖",habitat:"lake",emoji:"⛰️",latitude:latitude+0.0042,longitude:longitude-0.0036,unlockSteps:4000 },
    { id:"sea-local",name:"潮風堤防",habitat:"sea",emoji:"🌊",latitude:latitude-0.0054,longitude:longitude-0.0042,unlockSteps:8000 },
  ];
}
