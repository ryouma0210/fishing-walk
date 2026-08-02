import { Habitat } from "./game";

export type FishingArea = {
  id: string;
  name: string;
  subtitle: string;
  habitat: Habitat;
  emoji: string;
  bossFishId: string;
  bossName: string;
  fishIds: string[];
  chapter: number;
  node: { left: `${number}%`; top: `${number}%` };
};

const nodes = [
  { left: "53%", top: "80%" }, { left: "61%", top: "60%" },
  { left: "73%", top: "40%" }, { left: "27%", top: "22%" },
] as const;

export const FISHING_AREAS: FishingArea[] = [
  { id:"lotus_pond",name:"はじまりの蓮池",subtitle:"穏やかな池と水辺の生き物",habitat:"pond",emoji:"🌿",bossFishId:"pond_guardian",bossName:"蒼池のヌシ",chapter:1,node:nodes[0],fishIds:["pond_medaka","pond_goldfish","pond_crayfish","pond_tadpole","pond_frog","pond_loach","pond_bitterling","pond_crucian","pond_carp","pond_guardian"] },
  { id:"clear_river",name:"きらめき清流",subtitle:"滝から続く急流のエリア",habitat:"river",emoji:"🏞️",bossFishId:"river_colossus",bossName:"大河のガンリュウ",chapter:1,node:nodes[1],fishIds:["river_goby","river_dace","river_ayu","river_mitten_crab","river_yamame","river_iwana","river_rainbow","river_eel","river_catfish","river_colossus"] },
  { id:"azure_lake",name:"蒼天の大湖",subtitle:"山々に囲まれた深い湖",habitat:"lake",emoji:"🏔️",bossFishId:"lake_serpent",bossName:"蒼湖の大蛇",chapter:1,node:nodes[2],fishIds:["lake_smelt","lake_shrimp","lake_perch","lake_whitefish","lake_walleye","lake_kokanee","lake_bass","lake_pike","lake_trout","lake_serpent"] },
  { id:"ocean_cape",name:"さいはての海岬",subtitle:"伝説が眠る大洋と深海",habitat:"sea",emoji:"🌊",bossFishId:"sea_leviathan",bossName:"リヴァイアサン",chapter:1,node:nodes[3],fishIds:["sea_sardine","sea_horse_mackerel","sea_mackerel","sea_goby","sea_bream","sea_squid","sea_octopus","sea_yellowtail","sea_bonito","sea_leviathan"] },

  { id:"ancient_marsh",name:"幻光の古代湿原",subtitle:"古代遺跡が沈む光の湿原",habitat:"pond",emoji:"🪷",bossFishId:"pond_ancient_turtle",bossName:"千年亀",chapter:2,node:nodes[0],fishIds:["pond_bluegill","pond_softshell","pond_beetle","pond_silver_carp","pond_grass_carp","pond_snakehead","pond_albino_catfish","pond_golden_koi","pond_lotus_spirit","pond_ancient_turtle"] },
  { id:"thunder_canyon",name:"雷鳴の峡谷",subtitle:"雷雲と断崖に囲まれた激流",habitat:"river",emoji:"⚡",bossFishId:"river_dragon",bossName:"龍鱗の主",chapter:2,node:nodes[1],fishIds:["river_cherry_salmon","river_salamander","river_sturgeon","river_huchen","river_redtail","river_stingray","river_mekong","river_silver_king","river_crystal_spirit","river_dragon"] },
  { id:"moon_crater_lake",name:"月影の天輪湖",subtitle:"天空の月を映す巨大な湖",habitat:"lake",emoji:"🌙",bossFishId:"lake_guardian",bossName:"湖のヌシ",chapter:2,node:nodes[2],fishIds:["lake_burbot","lake_muskie","lake_gar","lake_paddlefish","lake_drum","lake_arapaima","lake_crocodile","lake_golden_trout","lake_axolotl","lake_guardian"] },
  { id:"polar_abyss",name:"極夜の深淵海",subtitle:"氷海の底に続く危険海域",habitat:"sea",emoji:"❄️",bossFishId:"sea_abyss_dragon",bossName:"深淵の龍魚",chapter:2,node:nodes[3],fishIds:["sea_mahi","sea_tuna","sea_swordfish","sea_grouper","sea_coelacanth","sea_oarfish","sea_giant_squid","sea_manta","sea_whale_shark","sea_abyss_dragon"] },

  { id:"mist_marsh",name:"白霧の迷い沼",subtitle:"濃霧に包まれた静かな沼",habitat:"pond",emoji:"🌫️",bossFishId:"pond_mist_boss",bossName:"霧沼のオオガマ",chapter:3,node:nodes[0],fishIds:["pond_mist_mosquitofish","pond_mist_shrimp","pond_mist_scorpion","pond_mist_mantis","pond_mist_toad","pond_mist_snakehead","pond_mist_black_carp","pond_mist_eel","pond_mist_finfish","pond_mist_boss"] },
  { id:"red_canyon",name:"赤雷の大峡谷",subtitle:"雷が岩壁を走る荒々しい川",habitat:"river",emoji:"⛈️",bossFishId:"river_canyon_boss",bossName:"峡谷王ライデン",chapter:3,node:nodes[1],fishIds:["river_canyon_oikawa","river_canyon_kajika","river_canyon_prawn","river_canyon_crab","river_canyon_amago","river_canyon_brown","river_canyon_nigoi","river_canyon_iwana","river_canyon_ayu","river_canyon_boss"] },
  { id:"sky_crater",name:"天空の火口湖",subtitle:"雲海の上に浮かぶ青い湖",habitat:"lake",emoji:"☁️",bossFishId:"lake_crater_boss",bossName:"クレーターキング",chapter:3,node:nodes[2],fishIds:["lake_crater_blueback","lake_crater_cisco","lake_crater_roach","lake_crater_shrimp","lake_crater_smallmouth","lake_crater_brook","lake_crater_sturgeon","lake_crater_pike","lake_crater_moontrout","lake_crater_boss"] },
  { id:"coral_kingdom",name:"虹珊瑚の王国",subtitle:"色鮮やかな珊瑚が広がる海",habitat:"sea",emoji:"🪸",bossFishId:"sea_coral_boss",bossName:"珊瑚王ケートス",chapter:3,node:nodes[3],fishIds:["sea_coral_clown","sea_coral_damsel","sea_coral_puffer","sea_coral_moray","sea_coral_lionfish","sea_coral_napoleon","sea_coral_barracuda","sea_coral_gt","sea_coral_tuna","sea_coral_boss"] },

  { id:"thunder_bog",name:"雷泥の魔沼",subtitle:"泥と稲妻が渦巻く危険な沼",habitat:"pond",emoji:"⚡",bossFishId:"pond_bog_boss",bossName:"泥王バルガス",chapter:4,node:nodes[0],fishIds:["pond_bog_minnow","pond_bog_snail","pond_bog_newt","pond_bog_dragonfly","pond_bog_kawabata","pond_bog_snakehead","pond_bog_akame","pond_bog_softshell","pond_bog_catfish","pond_bog_boss"] },
  { id:"glacier_river",name:"白銀の氷河川",subtitle:"氷瀑の下を流れる極寒の川",habitat:"river",emoji:"🧊",bossFishId:"river_glacier_boss",bossName:"氷瀑のフェンリル",chapter:4,node:nodes[1],fishIds:["river_glacier_dace","river_glacier_brook","river_glacier_lamprey","river_glacier_shrimp","river_glacier_char","river_glacier_salmon","river_glacier_king","river_glacier_huchen","river_glacier_crystal","river_glacier_boss"] },
  { id:"mirror_lake",name:"星映る鏡湖",subtitle:"星空を完全に映す神秘の湖",habitat:"lake",emoji:"✨",bossFishId:"lake_mirror_boss",bossName:"鏡湖の幻竜",chapter:4,node:nodes[2],fishIds:["lake_mirror_higai","lake_mirror_tamoroko","lake_mirror_shrimp","lake_mirror_snakehead","lake_mirror_carp","lake_mirror_bass","lake_mirror_perch","lake_mirror_aurora","lake_mirror_starsturgeon","lake_mirror_boss"] },
  { id:"true_abyss",name:"終極の深海溝",subtitle:"光の届かない最深海域",habitat:"sea",emoji:"🌑",bossFishId:"sea_abyss_boss",bossName:"深淵皇アビサル",chapter:4,node:nodes[3],fishIds:["sea_abyss_angler","sea_abyss_viper","sea_abyss_isopod","sea_abyss_dumbo","sea_abyss_goblin","sea_abyss_frilled","sea_abyss_vampire","sea_abyss_colossal","sea_abyss_oarfish","sea_abyss_boss"] },

  { id:"sacred_pond",name:"天蓮の神池",subtitle:"天空神殿に守られた最後の池",habitat:"pond",emoji:"⛩️",bossFishId:"pond_temple_boss",bossName:"神池のミズチ",chapter:5,node:{left:"64%",top:"68%"},fishIds:["pond_temple_goldfish","pond_temple_koi","pond_temple_loach","pond_temple_spider","pond_temple_turtle","pond_temple_grasscarp","pond_temple_serpent","pond_temple_jade_koi","pond_temple_lotus","pond_temple_boss"] },
  { id:"celestial_falls",name:"天界の大瀑布",subtitle:"雲を貫いて流れる最終の川",habitat:"river",emoji:"🌈",bossFishId:"river_falls_boss",bossName:"天瀑の龍神",chapter:5,node:{left:"38%",top:"30%"},fishIds:["river_falls_goby","river_falls_minnow","river_falls_donko","river_falls_chichibu","river_falls_satsuki","river_falls_biwa","river_falls_eel","river_falls_catfish","river_falls_dragonfish","river_falls_boss"] },
];
