export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";
export type Fish = { id: string; name: string; emoji: string; rank: Rank; minCm: number; maxCm: number; habitat: string; aquarium: string };
export type GearKind = "hat" | "top" | "bottom" | "shoes" | "rod" | "bait" | "cooler";
export type ShopItem = { id: string; name: string; emoji: string; kind: GearKind; cost: number; bonus: number; description: string };

export const FISH: Fish[] = [
  { id:"medaka",name:"メダカ",emoji:"🐟",rank:"E",minCm:2,maxCm:4,habitat:"pond",aquarium:"淡水館" },
  { id:"crayfish",name:"アメリカザリガニ",emoji:"🦞",rank:"E",minCm:6,maxCm:12,habitat:"river",aquarium:"淡水館" },
  { id:"carp",name:"コイ",emoji:"🐟",rank:"D",minCm:25,maxCm:65,habitat:"river",aquarium:"淡水館" },
  { id:"mackerel",name:"サバ",emoji:"🐟",rank:"C",minCm:20,maxCm:45,habitat:"sea",aquarium:"近海館" },
  { id:"squid",name:"アオリイカ",emoji:"🦑",rank:"B",minCm:20,maxCm:50,habitat:"sea",aquarium:"近海館" },
  { id:"bass",name:"ブラックバス",emoji:"🐠",rank:"B",minCm:30,maxCm:65,habitat:"lake",aquarium:"湖沼館" },
  { id:"salmon",name:"サケ",emoji:"🐟",rank:"A",minCm:55,maxCm:90,habitat:"river",aquarium:"回遊魚館" },
  { id:"tuna",name:"クロマグロ",emoji:"🐟",rank:"S",minCm:90,maxCm:250,habitat:"sea",aquarium:"大洋館" },
  { id:"arapaima",name:"ピラルク",emoji:"🐉",rank:"SS",minCm:160,maxCm:300,habitat:"lake",aquarium:"怪魚館" },
  { id:"whaleShark",name:"ジンベエザメ",emoji:"🦈",rank:"SSS",minCm:500,maxCm:1200,habitat:"sea",aquarium:"伝説館" }
];

export const SHOP: ShopItem[] = [
  {id:"cap",name:"潮風キャップ",emoji:"🧢",kind:"hat",cost:80,bonus:1,description:"レア魚率を少し上げる"},
  {id:"jacket",name:"防水ジャケット",emoji:"🧥",kind:"top",cost:120,bonus:1,description:"大物とのファイトを支える"},
  {id:"pants",name:"アングラーパンツ",emoji:"👖",kind:"bottom",cost:100,bonus:1,description:"釣果コインを少し増やす"},
  {id:"boots",name:"磯ブーツ",emoji:"🥾",kind:"shoes",cost:90,bonus:1,description:"歩数ボーナスを強化"},
  {id:"rod2",name:"カーボンロッド",emoji:"🎣",kind:"rod",cost:250,bonus:3,description:"Aランクまで狙いやすい"},
  {id:"rod3",name:"マスターロッド",emoji:"🎣",kind:"rod",cost:800,bonus:6,description:"SSSランクへの挑戦権"},
  {id:"bait2",name:"プレミアム餌",emoji:"🪱",kind:"bait",cost:150,bonus:2,description:"高ランク出現率アップ"},
  {id:"cooler2",name:"大型クーラー",emoji:"🧊",kind:"cooler",cost:300,bonus:3,description:"大物サイズ率アップ"}
];

export const RANKS: Rank[] = ["E","D","C","B","A","S","SS","SSS"];
