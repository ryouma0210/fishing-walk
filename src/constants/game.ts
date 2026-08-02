export type Rank = "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";
export type Habitat = "pond" | "river" | "lake" | "sea";
export type GearKind = "hat" | "top" | "bottom" | "shoes" | "rod" | "reel" | "bait" | "cooler";
export type GearEffect = "outfit" | "rod" | "reel" | "bait" | "capacity";

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
  targetRanks?: Rank[];
  dailyCapacity?: number;
  consumable?: boolean;
};

export const RANKS: Rank[] = ["E", "D", "C", "B", "A", "S", "SS", "SSS"];
export const RANK_INDEX = Object.fromEntries(RANKS.map((rank, index) => [rank, index])) as Record<Rank, number>;
export const HABITAT_NAMES: Record<Habitat, string> = {
  pond: "池・公園",
  river: "川",
  lake: "湖",
  sea: "海",
};

function creature(
  id: string, name: string, rank: Rank, minCm: number, maxCm: number,
  habitat: Habitat, aquarium: string, description: string, emoji = "🐟",
): Fish {
  return { id, name, emoji, rank, minCm, maxCm, habitats: [habitat], aquarium, description };
}

// イラストシートの並びと同じく、池・川・湖・海を各20種ずつ定義する。
export const FISH: Fish[] = [
  // 池 20種
  creature("pond_medaka","メダカ","E",2,4,"pond","池の小魚館","群れで泳ぐ小さな池の魚。"),
  creature("pond_goldfish","キンギョ","E",5,20,"pond","池の小魚館","鮮やかな尾びれを揺らす人気者。","🐠"),
  creature("pond_crayfish","アメリカザリガニ","E",6,14,"pond","池の生き物館","赤いハサミを持つ水辺の住人。","🦞"),
  creature("pond_tadpole","オタマジャクシ","E",2,8,"pond","池の生き物館","やがてカエルへ育つ小さな命。","●"),
  creature("pond_frog","トノサマガエル","D",5,12,"pond","池の生き物館","水面から大きく跳ねる。","🐸"),
  creature("pond_loach","ドジョウ","D",8,25,"pond","池の小魚館","泥の中へ器用に潜る。"),
  creature("pond_bitterling","タイリクバラタナゴ","D",4,10,"pond","池の小魚館","虹色に輝く小型魚。"),
  creature("pond_crucian","フナ","C",15,45,"pond","池の魚館","身近な池で長く親しまれる。"),
  creature("pond_carp","コイ","C",30,100,"pond","池の魚館","悠々と泳ぐ池の力持ち。"),
  creature("pond_bluegill","ブルーギル","C",12,35,"pond","池の魚館","青いエラと丸い体が特徴。","🐠"),
  creature("pond_softshell","スッポン","B",20,45,"pond","池の生き物館","素早く泳ぐ柔らかな甲羅の亀。","🐢"),
  creature("pond_beetle","ゲンゴロウ","B",3,5,"pond","池の生き物館","水中を飛ぶように泳ぐ昆虫。","🪲"),
  creature("pond_silver_carp","ハクレン","B",60,130,"pond","池の大魚館","銀色の巨体で水面を跳ねる。"),
  creature("pond_grass_carp","ソウギョ","A",70,160,"pond","池の大魚館","水草を食べて大きく育つ。"),
  creature("pond_snakehead","カムルチー","A",45,120,"pond","池の大魚館","空気呼吸もできる強靱な魚。"),
  creature("pond_albino_catfish","白ナマズ","S",60,170,"pond","池の幻魚館","白い体を持つ珍しいナマズ。"),
  creature("pond_golden_koi","黄金の大鯉","S",90,190,"pond","池の幻魚館","黄金の鱗をきらめかせる池の主。","✨"),
  creature("pond_lotus_spirit","蓮華の精霊魚","SS",50,140,"pond","池の幻魚館","蓮の花をまとった幻想魚。","🪷"),
  creature("pond_ancient_turtle","千年亀","SSS",180,450,"pond","池の伝説館","千年分の水辺の記憶を背負う。","🐢"),
  creature("pond_guardian","蒼池のヌシ","SSS",250,650,"pond","池の伝説館","池の霧を操る伝説の守護魚。","🌌"),

  // 川 20種
  creature("river_goby","カワハゼ","E",5,18,"river","清流小魚館","川底の石陰で暮らす。"),
  creature("river_dace","ウグイ","E",10,40,"river","清流小魚館","流れの中を群れで泳ぐ。"),
  creature("river_ayu","アユ","E",15,32,"river","清流小魚館","香魚とも呼ばれる清流の魚。"),
  creature("river_mitten_crab","モクズガニ","E",5,9,"river","川の生き物館","毛の生えたハサミが特徴。","🦀"),
  creature("river_yamame","ヤマメ","D",15,40,"river","渓流館","美しい斑点を持つ渓流魚。"),
  creature("river_iwana","イワナ","D",18,55,"river","渓流館","冷たい源流域に棲む。"),
  creature("river_rainbow","ニジマス","D",25,70,"river","渓流館","虹色の帯を輝かせる。"),
  creature("river_eel","ニホンウナギ","C",35,120,"river","大河館","夜の川底を進む長い魚。","🐍"),
  creature("river_catfish","ナマズ","C",40,140,"river","大河館","ヒゲで暗い水底を探る。"),
  creature("river_cherry_salmon","サクラマス","C",35,75,"river","回遊魚館","桜の季節に川を上る。"),
  creature("river_salamander","オオサンショウウオ","B",50,150,"river","川の生き物館","清流に棲む世界最大級の両生類。","🦎"),
  creature("river_sturgeon","チョウザメ","B",80,280,"river","古代魚館","鎧のような鱗を持つ古代魚。"),
  creature("river_huchen","イトウ","B",70,210,"river","大河館","幻とも呼ばれる巨大なサケ科魚。"),
  creature("river_redtail","レッドテールキャット","A",70,180,"river","怪魚館","赤い尾を持つ大型ナマズ。"),
  creature("river_stingray","ヒマンチュラ","A",90,240,"river","怪魚館","大河の底を滑る巨大淡水エイ。","◈"),
  creature("river_mekong","メコンオオナマズ","S",150,320,"river","怪魚館","大河に棲む世界最大級のナマズ。","🐋"),
  creature("river_silver_king","白銀の川王","S",100,230,"river","川の幻魚館","急流を銀光で切り裂く王魚。","✨"),
  creature("river_crystal_spirit","水晶渓魚","SS",80,190,"river","川の幻魚館","水晶の鱗を持つ精霊魚。","💎"),
  creature("river_dragon","龍鱗の主","SSS",300,850,"river","川の伝説館","清流を守る龍の化身。","🐲"),
  creature("river_colossus","大河のガンリュウ","SSS",400,1000,"river","川の伝説館","岩の甲羅を持つ大河の守護獣。","🪨"),

  // 湖 20種
  creature("lake_smelt","ワカサギ","E",7,18,"lake","湖の小魚館","冷たい湖で群れを作る。"),
  creature("lake_shrimp","スジエビ","E",3,8,"lake","湖の生き物館","透明な体を持つ小さなエビ。","🦐"),
  creature("lake_perch","イエローパーチ","E",15,35,"lake","湖の小魚館","黄色と黒の縞模様が特徴。"),
  creature("lake_whitefish","レイクホワイトフィッシュ","E",25,60,"lake","湖の小魚館","深く冷たい湖を好む銀色の魚。"),
  creature("lake_walleye","ウォールアイ","D",30,80,"lake","湖沼館","暗い水中でも獲物を見つける。"),
  creature("lake_kokanee","ヒメマス","D",25,55,"lake","湖沼館","湖で暮らす鮮やかなサケ。"),
  creature("lake_bass","ブラックバス","D",30,75,"lake","湖沼館","強い引きで釣り人を魅了する。","🐠"),
  creature("lake_pike","ノーザンパイク","C",45,130,"lake","湖の大魚館","鋭い歯を持つ待ち伏せの名手。"),
  creature("lake_trout","レイクトラウト","C",40,110,"lake","湖の大魚館","深い湖に棲む大型マス。"),
  creature("lake_burbot","カワメンタイ","C",35,100,"lake","湖の大魚館","タラの仲間では珍しい淡水魚。"),
  creature("lake_muskie","マスキーパイク","B",70,180,"lake","湖の大魚館","湖の千投魚と呼ばれる強敵。"),
  creature("lake_gar","アリゲーターガー","B",100,300,"lake","古代魚館","長い口と硬い鱗を持つ。","🐊"),
  creature("lake_paddlefish","ヘラチョウザメ","B",100,220,"lake","古代魚館","へら状の長い吻を持つ古代魚。"),
  creature("lake_drum","フレッシュウォータードラム","A",45,120,"lake","湖の大魚館","水中で太鼓のような音を出す。"),
  creature("lake_arapaima","ピラルク","A",160,360,"lake","怪魚館","水面で空気を吸う巨大淡水魚。","🐉"),
  creature("lake_crocodile","湖岸の巨大ワニ","S",250,550,"lake","湖の怪獣館","湖岸に潜む巨大な爬虫類。","🐊"),
  creature("lake_golden_trout","黄金レイクトラウト","S",80,180,"lake","湖の幻魚館","夕日を映す黄金のマス。","✨"),
  creature("lake_axolotl","月光ウーパールーパー","SS",35,100,"lake","湖の幻魚館","月光をまとった湖の精霊。","🌙"),
  creature("lake_guardian","湖のヌシ","SSS",220,550,"lake","湖の伝説館","星明かりの夜に現れる守護魚。","🌌"),
  creature("lake_serpent","蒼湖の大蛇","SSS",600,1600,"lake","湖の伝説館","湖底を一周するほど巨大な水蛇。","🐉"),

  // 海 20種
  creature("sea_sardine","マイワシ","E",12,28,"sea","近海小魚館","銀色の大群で海を渡る。"),
  creature("sea_horse_mackerel","マアジ","E",15,40,"sea","近海小魚館","黄色い尾の線が美しい。"),
  creature("sea_mackerel","マサバ","E",20,50,"sea","近海小魚館","青い背の模様を持つ回遊魚。"),
  creature("sea_goby","海ハゼ","E",7,25,"sea","近海小魚館","堤防の海底で暮らす。"),
  creature("sea_bream","マダイ","D",30,100,"sea","近海館","祝い魚として愛される。","🐠"),
  creature("sea_squid","アオリイカ","D",20,60,"sea","海の生き物館","透明なひれを波打たせる。","🦑"),
  creature("sea_octopus","マダコ","D",30,100,"sea","海の生き物館","岩場に潜む八本足の知恵者。","🐙"),
  creature("sea_yellowtail","ブリ","C",60,160,"sea","回遊魚館","成長で名前が変わる出世魚。"),
  creature("sea_bonito","カツオ","C",45,110,"sea","回遊魚館","暖流を高速で泳ぐ。"),
  creature("sea_mahi","シイラ","C",70,190,"sea","大洋館","青緑と黄金に輝く外洋魚。"),
  creature("sea_tuna","クロマグロ","B",90,320,"sea","大洋館","外洋を泳ぎ続ける巨体。"),
  creature("sea_swordfish","メカジキ","B",150,450,"sea","大洋館","剣のような吻で海を切る。"),
  creature("sea_grouper","タマカイ","B",100,300,"sea","大洋館","岩礁に潜む巨大なハタ。"),
  creature("sea_coelacanth","シーラカンス","A",120,230,"sea","古代魚館","深海から現れる生きた化石。","🦴"),
  creature("sea_oarfish","リュウグウノツカイ","A",300,1000,"sea","深海館","銀色の長い体を持つ深海魚。","🎗️"),
  creature("sea_giant_squid","ダイオウイカ","S",500,1400,"sea","深海館","深海に潜む巨大な十本足。","🦑"),
  creature("sea_manta","オニイトマキエイ","S",300,800,"sea","大洋館","翼のようなひれで海を舞う。","◈"),
  creature("sea_whale_shark","ジンベエザメ","SS",500,1300,"sea","海の幻獣館","星模様をまとう世界最大の魚。","🦈"),
  creature("sea_abyss_dragon","深淵の龍魚","SSS",250,700,"sea","海の伝説館","青い光で深海を照らす魔魚。","💠"),
  creature("sea_leviathan","リヴァイアサン","SSS",900,2200,"sea","海の伝説館","大洋の底に眠る究極の大物。","🐉"),

  // 追加エリア用 100種（池30・川30・湖20・海20）
  creature("pond_mist_mosquitofish","カダヤシ","E",2,6,"pond","霧沼館","水面近くを素早く泳ぐ小魚。"),
  creature("pond_mist_shrimp","ヌマエビ","E",2,7,"pond","霧沼館","水草の陰で暮らす小さなエビ。","🦐"),
  creature("pond_mist_scorpion","タイコウチ","D",3,6,"pond","霧沼館","鎌のような前脚を持つ水生昆虫。","🪲"),
  creature("pond_mist_mantis","ミズカマキリ","C",4,7,"pond","霧沼館","細長い体で獲物を待ち伏せる。","🪲"),
  creature("pond_mist_toad","ヒキガエル","B",8,18,"pond","霧沼館","霧の岸辺に暮らす大きなカエル。","🐸"),
  creature("pond_mist_snakehead","若草ライギョ","A",35,95,"pond","霧沼館","水草を切り裂いて泳ぐ強魚。"),
  creature("pond_mist_black_carp","黒鯉","S",70,150,"pond","霧沼館","霧の底に溶け込む漆黒の巨鯉。"),
  creature("pond_mist_eel","霧沼オオウナギ","SS",100,260,"pond","霧沼館","夜霧とともに現れる巨大ウナギ。","🐍"),
  creature("pond_mist_finfish","霞ヒレ魚","SS",80,190,"pond","霧沼館","半透明のひれで霞をまとう幻魚。","✨"),
  creature("pond_mist_boss","霧沼のオオガマ","SSS",220,520,"pond","霧沼ヌシ館","沼全体を震わせる太古の大ガマ。","🐸"),

  creature("pond_bog_minnow","モツゴ","E",5,12,"pond","雷泥沼館","浅い泥沼を群れで泳ぐ。"),
  creature("pond_bog_snail","マルタニシ","E",3,7,"pond","雷泥沼館","丸い殻を持つ水辺の掃除屋。","🐚"),
  creature("pond_bog_newt","アカハライモリ","D",7,14,"pond","雷泥沼館","赤い腹を見せる小さな両生類。","🦎"),
  creature("pond_bog_dragonfly","オニヤゴ","C",4,8,"pond","雷泥沼館","泥底に潜む大型トンボの幼虫。","🪲"),
  creature("pond_bog_kawabata","カワバタモロコ","B",5,12,"pond","雷泥沼館","黄金色に輝く希少な小魚。"),
  creature("pond_bog_snakehead","雷ライギョ","A",55,130,"pond","雷泥沼館","雷雨の水面で激しく暴れる。","⚡"),
  creature("pond_bog_akame","淡水アカメ","S",80,180,"pond","雷泥沼館","暗闇で赤い目を光らせる怪魚。"),
  creature("pond_bog_softshell","巨大スッポン","SS",100,240,"pond","雷泥沼館","泥を巻き上げ突進する大亀。","🐢"),
  creature("pond_bog_catfish","沼影ナマズ","SS",130,310,"pond","雷泥沼館","雷鳴とともに浮上する黒い影。"),
  creature("pond_bog_boss","泥王バルガス","SSS",350,850,"pond","雷泥沼ヌシ館","泥と雷を操る沼の暴君。","👑"),

  creature("pond_temple_goldfish","デメキン","E",6,18,"pond","神池館","大きな目と優雅な尾を持つ。","🐠"),
  creature("pond_temple_koi","錦鯉","E",20,75,"pond","神池館","鮮やかな模様で神池を彩る。"),
  creature("pond_temple_loach","ホトケドジョウ","D",4,9,"pond","神池館","湧水に棲む穏やかな小魚。"),
  creature("pond_temple_spider","ミズグモ","C",1,2,"pond","神池館","水中に空気の部屋を作る。","🕷️"),
  creature("pond_temple_turtle","蓮亀","B",25,65,"pond","神池館","蓮の葉を甲羅に乗せた亀。","🐢"),
  creature("pond_temple_grasscarp","青鱗ソウギョ","A",90,190,"pond","神池館","青い鱗を輝かせる大魚。"),
  creature("pond_temple_serpent","白蛇魚","S",110,280,"pond","神池館","白蛇のように神池を巡る。","🐍"),
  creature("pond_temple_jade_koi","翡翠鯉","SS",100,220,"pond","神池館","翡翠色の鱗を持つ神秘の鯉。","💎"),
  creature("pond_temple_lotus","古代ハス魚","SS",160,360,"pond","神池館","古代蓮と共生する巨大魚。","🪷"),
  creature("pond_temple_boss","神池のミズチ","SSS",500,1200,"pond","神池ヌシ館","神殿の池を守る水龍。","🐉"),

  creature("river_canyon_oikawa","オイカワ","E",8,18,"river","雷峡谷館","銀青色の体で瀬を走る。"),
  creature("river_canyon_kajika","カジカ","E",7,16,"river","雷峡谷館","岩底に張り付く小魚。"),
  creature("river_canyon_prawn","テナガエビ","D",7,18,"river","雷峡谷館","長い腕で岩陰の餌を探す。","🦐"),
  creature("river_canyon_crab","サワガニ","C",4,8,"river","雷峡谷館","清流の岸を歩く赤いカニ。","🦀"),
  creature("river_canyon_amago","アマゴ","B",18,45,"river","雷峡谷館","朱点を輝かせる渓流魚。"),
  creature("river_canyon_brown","ブラウントラウト","A",35,95,"river","雷峡谷館","褐色の斑点を持つ強いマス。"),
  creature("river_canyon_nigoi","巨岩ニゴイ","S",60,140,"river","雷峡谷館","岩のような頭で急流を進む。"),
  creature("river_canyon_iwana","峡谷オオイワナ","SS",90,210,"river","雷峡谷館","断崖の滝壺に潜む大岩魚。"),
  creature("river_canyon_ayu","雷光アユ","SS",45,110,"river","雷峡谷館","雷光のような線を残して泳ぐ。","⚡"),
  creature("river_canyon_boss","峡谷王ライデン","SSS",420,980,"river","雷峡谷ヌシ館","雷雲を呼ぶ峡谷の王魚。","👑"),

  creature("river_glacier_dace","エゾウグイ","E",12,35,"river","氷河川館","冷たい流れを群れで進む。"),
  creature("river_glacier_brook","カワマス","E",18,45,"river","氷河川館","白い縁のひれが美しい。"),
  creature("river_glacier_lamprey","スナヤツメ","D",12,24,"river","氷河川館","砂底に潜む古い姿の魚。"),
  creature("river_glacier_shrimp","氷エビ","C",4,10,"river","氷河川館","透き通った体を持つ冷水のエビ。","🦐"),
  creature("river_glacier_char","オショロコマ","B",18,50,"river","氷河川館","北の清流に棲む色鮮やかな魚。"),
  creature("river_glacier_salmon","シロザケ","A",60,120,"river","氷河川館","長い旅を終えて川へ戻る。"),
  creature("river_glacier_king","キングサーモン","S",90,180,"river","氷河川館","圧倒的な力を持つサケの王。"),
  creature("river_glacier_huchen","氷河イトウ","SS",130,300,"river","氷河川館","氷の下を静かに泳ぐ巨大魚。"),
  creature("river_glacier_crystal","クリスタルサーモン","SS",100,240,"river","氷河川館","水晶のような鱗を持つ。","💎"),
  creature("river_glacier_boss","氷瀑のフェンリル","SSS",480,1100,"river","氷河川ヌシ館","氷瀑を砕いて現れる白銀の怪魚。","❄️"),

  creature("river_falls_goby","ヨシノボリ","E",5,13,"river","天瀑館","吸盤で岩に張り付く小魚。"),
  creature("river_falls_minnow","アブラハヤ","E",7,16,"river","天瀑館","滝下の淀みを群れで泳ぐ。"),
  creature("river_falls_donko","ドンコ","D",10,25,"river","天瀑館","大きな口で獲物を待つ。"),
  creature("river_falls_chichibu","ヌマチチブ","C",8,20,"river","天瀑館","激しい流れにも負けない。"),
  creature("river_falls_satsuki","サツキマス","B",30,65,"river","天瀑館","初夏に美しい銀色で遡上する。"),
  creature("river_falls_biwa","ビワマス","A",40,85,"river","天瀑館","深い流れを好む大型マス。"),
  creature("river_falls_eel","天瀑オオウナギ","S",120,290,"river","天瀑館","滝裏の洞窟に潜む。","🐍"),
  creature("river_falls_catfish","金剛ナマズ","SS",150,340,"river","天瀑館","岩をも砕く強靱な頭を持つ。"),
  creature("river_falls_dragonfish","飛瀑龍魚","SS",180,420,"river","天瀑館","滝を空へ駆け上がる幻魚。","🐲"),
  creature("river_falls_boss","天瀑の龍神","SSS",650,1500,"river","天瀑ヌシ館","天空の滝を統べる龍神。","🐉"),

  creature("lake_crater_blueback","ブルーバック","E",12,28,"lake","天輪湖館","青い背で湖面の光に溶ける。"),
  creature("lake_crater_cisco","レイクシスコ","E",15,35,"lake","天輪湖館","沖合を大きな群れで泳ぐ。"),
  creature("lake_crater_roach","ローチ","D",18,42,"lake","天輪湖館","赤いひれが特徴の湖魚。"),
  creature("lake_crater_shrimp","湖エビ","C",5,12,"lake","天輪湖館","火口湖の岩陰で暮らす。","🦐"),
  creature("lake_crater_smallmouth","スモールマウスバス","B",30,65,"lake","天輪湖館","素早い突進を繰り返す。"),
  creature("lake_crater_brook","ブルックトラウト","A",35,80,"lake","天輪湖館","星のような斑点を持つ。"),
  creature("lake_crater_sturgeon","レイクスタージョン","S",110,260,"lake","天輪湖館","湖底を進む長寿の古代魚。"),
  creature("lake_crater_pike","巨大パイク","SS",120,280,"lake","天輪湖館","鋭い歯で大型魚を襲う。"),
  creature("lake_crater_moontrout","月輪マス","SS",90,210,"lake","天輪湖館","月明かりで輪紋が輝く。","🌙"),
  creature("lake_crater_boss","クレーターキング","SSS",500,1250,"lake","天輪湖ヌシ館","火口湖の深部を支配する王魚。","👑"),

  creature("lake_mirror_higai","ヒガイ","E",12,28,"lake","鏡湖館","鏡のような浅瀬を泳ぐ。"),
  creature("lake_mirror_tamoroko","タモロコ","E",6,14,"lake","鏡湖館","岸辺を群れで移動する。"),
  creature("lake_mirror_shrimp","鏡湖スジエビ","D",4,9,"lake","鏡湖館","透明な体で景色に溶け込む。","🦐"),
  creature("lake_mirror_snakehead","鏡湖カムルチー","C",45,105,"lake","鏡湖館","水面の影から獲物を狙う。"),
  creature("lake_mirror_carp","鏡鯉","B",55,125,"lake","鏡湖館","磨かれた銀鏡のような鱗を持つ。"),
  creature("lake_mirror_bass","銀鱗バス","A",50,110,"lake","鏡湖館","銀色の体で激しく跳ねる。"),
  creature("lake_mirror_perch","幻影パーチ","S",60,145,"lake","鏡湖館","残像を残すほど素早く泳ぐ。"),
  creature("lake_mirror_aurora","オーロラトラウト","SS",100,230,"lake","鏡湖館","七色の光をまとう巨大マス。","✨"),
  creature("lake_mirror_starsturgeon","星影チョウザメ","SS",180,410,"lake","鏡湖館","星空を映す黒い古代魚。"),
  creature("lake_mirror_boss","鏡湖の幻竜","SSS",700,1700,"lake","鏡湖ヌシ館","水鏡の向こうから現れる幻竜。","🐉"),

  creature("sea_coral_clown","クマノミ","E",6,15,"sea","珊瑚海館","イソギンチャクと暮らす小魚。","🐠"),
  creature("sea_coral_damsel","ルリスズメダイ","E",5,12,"sea","珊瑚海館","瑠璃色に輝く珊瑚礁の宝石。","🐠"),
  creature("sea_coral_puffer","ハリセンボン","D",20,50,"sea","珊瑚海館","驚くと体を大きく膨らませる。","🐡"),
  creature("sea_coral_moray","ウツボ","C",60,180,"sea","珊瑚海館","岩穴から鋭い歯をのぞかせる。","🐍"),
  creature("sea_coral_lionfish","ミノカサゴ","B",25,55,"sea","珊瑚海館","華麗なひれに毒棘を隠す。"),
  creature("sea_coral_napoleon","ナポレオンフィッシュ","A",100,240,"sea","珊瑚海館","大きな額を持つ珊瑚礁の主役。"),
  creature("sea_coral_barracuda","バラクーダ","S",100,220,"sea","珊瑚海館","銀の矢のように獲物を追う。"),
  creature("sea_coral_gt","ロウニンアジ","SS",120,260,"sea","珊瑚海館","珊瑚礁を巡る圧倒的な強魚。"),
  creature("sea_coral_tuna","虹珊瑚マグロ","SS",180,420,"sea","珊瑚海館","虹色の光を反射する大マグロ。","🌈"),
  creature("sea_coral_boss","珊瑚王ケートス","SSS",650,1600,"sea","珊瑚海ヌシ館","巨大な珊瑚を背負う海獣。","👑"),

  creature("sea_abyss_angler","チョウチンアンコウ","E",20,60,"sea","極夜深海館","発光器で暗闇の獲物を誘う。"),
  creature("sea_abyss_viper","ホウライエソ","E",18,45,"sea","極夜深海館","長い牙を持つ深海の小さな怪魚。"),
  creature("sea_abyss_isopod","ダイオウグソクムシ","D",25,50,"sea","極夜深海館","鎧のような殻で深海底を歩く。","🪲"),
  creature("sea_abyss_dumbo","メンダコ","C",15,35,"sea","極夜深海館","耳のようなひれで優雅に泳ぐ。","🐙"),
  creature("sea_abyss_goblin","ミツクリザメ","B",250,450,"sea","極夜深海館","飛び出す顎を持つ古代のサメ。","🦈"),
  creature("sea_abyss_frilled","ラブカ","A",150,280,"sea","極夜深海館","蛇のような姿を残す原始的なサメ。","🦈"),
  creature("sea_abyss_vampire","コウモリダコ","S",30,80,"sea","極夜深海館","黒い膜を広げて深海を舞う。","🐙"),
  creature("sea_abyss_colossal","ダイオウホウズキイカ","SS",600,1500,"sea","極夜深海館","巨大な目で暗闇を見通す。","🦑"),
  creature("sea_abyss_oarfish","冥海リュウグウ","SS",500,1400,"sea","極夜深海館","青白い光を引いて泳ぐ長大魚。","💠"),
  creature("sea_abyss_boss","深淵皇アビサル","SSS",1200,3000,"sea","極夜深海ヌシ館","海溝の最深部に君臨する深淵皇。","👑"),
];

export const SHOP: ShopItem[] = [
  {id:"hat1",name:"潮風キャップ",emoji:"🧢",kind:"hat",cost:40,effect:"outfit",power:1,description:"魚速度-3%・サイズ+2%"},
  {id:"hat2",name:"アングラーハット",emoji:"👒",kind:"hat",cost:160,effect:"outfit",power:2,description:"魚速度-6%・サイズ+4%"},
  {id:"hat3",name:"ストームフード",emoji:"🧢",kind:"hat",cost:480,effect:"outfit",power:3,description:"魚速度-9%・サイズ+6%"},
  {id:"hat4",name:"海王の冠",emoji:"👑",kind:"hat",cost:1400,effect:"outfit",power:4,description:"魚速度-12%・サイズ+8%"},
  {id:"top1",name:"ライトシャツ",emoji:"👕",kind:"top",cost:50,effect:"outfit",power:1,description:"魚速度-3%・サイズ+2%"},
  {id:"top2",name:"防水ジャケット",emoji:"🧥",kind:"top",cost:190,effect:"outfit",power:2,description:"魚速度-6%・サイズ+4%"},
  {id:"top3",name:"ストームジャケット",emoji:"🥋",kind:"top",cost:550,effect:"outfit",power:3,description:"魚速度-9%・サイズ+6%"},
  {id:"top4",name:"海王コート",emoji:"🧥",kind:"top",cost:1600,effect:"outfit",power:4,description:"魚速度-12%・サイズ+8%"},
  {id:"bottom1",name:"フィッシングショーツ",emoji:"🩳",kind:"bottom",cost:45,effect:"outfit",power:1,description:"魚速度-3%・サイズ+2%"},
  {id:"bottom2",name:"カーゴパンツ",emoji:"👖",kind:"bottom",cost:180,effect:"outfit",power:2,description:"魚速度-6%・サイズ+4%"},
  {id:"bottom3",name:"テクニカルパンツ",emoji:"👖",kind:"bottom",cost:520,effect:"outfit",power:3,description:"魚速度-9%・サイズ+6%"},
  {id:"bottom4",name:"財宝パンツ",emoji:"🩳",kind:"bottom",cost:1500,effect:"outfit",power:4,description:"魚速度-12%・サイズ+8%"},
  {id:"shoes1",name:"デッキシューズ",emoji:"👟",kind:"shoes",cost:45,effect:"outfit",power:1,description:"魚速度-3%・サイズ+2%"},
  {id:"shoes2",name:"磯ブーツ",emoji:"🥾",kind:"shoes",cost:170,effect:"outfit",power:2,description:"魚速度-6%・サイズ+4%"},
  {id:"shoes3",name:"トレイルシューズ",emoji:"👟",kind:"shoes",cost:500,effect:"outfit",power:3,description:"魚速度-9%・サイズ+6%"},
  {id:"shoes4",name:"潮渡りの靴",emoji:"🥾",kind:"shoes",cost:1450,effect:"outfit",power:4,description:"魚速度-12%・サイズ+8%"},
  {id:"rod1",name:"グラスロッド",emoji:"🎣",kind:"rod",cost:60,effect:"rod",power:1,description:"必要維持時間-5%"},
  {id:"rod2",name:"カーボンロッド",emoji:"🎣",kind:"rod",cost:240,effect:"rod",power:2,description:"必要維持時間-10%"},
  {id:"rod3",name:"チタンロッド",emoji:"🎣",kind:"rod",cost:800,effect:"rod",power:3,description:"必要維持時間-15%"},
  {id:"rod4",name:"マスターロッド",emoji:"⚡",kind:"rod",cost:2400,effect:"rod",power:4,description:"必要維持時間-20%"},
  {id:"reel1",name:"スピンリール",emoji:"⚙️",kind:"reel",cost:55,effect:"reel",power:1,description:"対象ゲージ+3%・時間-4%"},
  {id:"reel2",name:"精密リール",emoji:"⚙️",kind:"reel",cost:230,effect:"reel",power:2,description:"対象ゲージ+6%・時間-8%"},
  {id:"reel3",name:"パワーリール",emoji:"⚙️",kind:"reel",cost:760,effect:"reel",power:3,description:"対象ゲージ+9%・時間-12%"},
  {id:"reel4",name:"海王リール",emoji:"💠",kind:"reel",cost:2200,effect:"reel",power:4,description:"対象ゲージ+12%・時間-16%"},
  {id:"bait1",name:"ミミズ餌",emoji:"🪱",kind:"bait",cost:1,effect:"bait",power:1,description:"E・Dランク狙い／1投分",targetRanks:["E","D"],consumable:true},
  {id:"bait2",name:"練り餌",emoji:"🍡",kind:"bait",cost:3,effect:"bait",power:2,description:"C・Bランク狙い／1投分",targetRanks:["C","B"],consumable:true},
  {id:"bait3",name:"活き餌",emoji:"🪣",kind:"bait",cost:8,effect:"bait",power:3,description:"A・Sランク狙い／1投分",targetRanks:["A","S"],consumable:true},
  {id:"bait4",name:"幻光ルアー",emoji:"💎",kind:"bait",cost:25,effect:"bait",power:4,description:"SS・SSSランク狙い／1投分",targetRanks:["SS","SSS"],consumable:true},
  {id:"cooler1",name:"コンパクトクーラー",emoji:"🧊",kind:"cooler",cost:80,effect:"capacity",power:1,description:"一日50匹まで",dailyCapacity:50},
  {id:"cooler2",name:"ミドルクーラー",emoji:"🧊",kind:"cooler",cost:280,effect:"capacity",power:2,description:"一日100匹まで",dailyCapacity:100},
  {id:"cooler3",name:"大型キャリークーラー",emoji:"🧊",kind:"cooler",cost:1000,effect:"capacity",power:3,description:"一日500匹まで",dailyCapacity:500},
  {id:"cooler4",name:"極寒クーラー",emoji:"❄️",kind:"cooler",cost:3000,effect:"capacity",power:4,description:"一日1,000匹まで",dailyCapacity:1000},
];

export const DEFAULT_GEAR: Record<GearKind, string> = {
  hat: "なし", top: "普段着", bottom: "普段のズボン", shoes: "スニーカー",
  rod: "ビギナーロッド", reel: "標準リール", bait: "餌なし", cooler: "簡易バケツ（10匹）",
};
