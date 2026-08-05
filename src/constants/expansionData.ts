import { PrefectureSeed, PREFECTURES } from "./prefectureData";

export type ChapterId = "japan" | "world" | "space";
export type AreaSeed = PrefectureSeed & { chapter: ChapterId; products: [string, string] };

const world = (slug: string, name: string, products: [string, string], habitat: PrefectureSeed["habitat"]): AreaSeed => ({ slug:`world_${slug}`, name, products, habitat, chapter:"world" });
const space = (slug: string, name: string, products: [string, string], habitat: PrefectureSeed["habitat"]): AreaSeed => ({ slug:`space_${slug}`, name, products, habitat, chapter:"space" });

export const JAPAN_AREAS: AreaSeed[] = PREFECTURES.map((area) => ({ ...area, chapter:"japan" }));

export const WORLD_AREAS: AreaSeed[] = [
  world("south_korea","韓国",["キムチ","韓国海苔"],"sea"), world("china","中国",["月餅","ジャスミン茶"],"river"),
  world("mongolia","モンゴル",["岩塩","フェルト人形"],"lake"), world("taiwan","台湾",["パイナップルケーキ","烏龍茶"],"sea"),
  world("philippines","フィリピン",["マンゴー","貝細工"],"sea"), world("vietnam","ベトナム",["フォー","蓮茶"],"river"),
  world("thailand","タイ",["トムヤムクン","シルク"],"river"), world("cambodia","カンボジア",["胡椒","クロマー"],"lake"),
  world("malaysia","マレーシア",["ドリアン","錫細工"],"sea"), world("singapore","シンガポール",["カヤジャム","マーライオン像"],"sea"),
  world("indonesia","インドネシア",["コーヒー","バティック"],"sea"), world("india","インド",["スパイス","紅茶"],"river"),
  world("nepal","ネパール",["ヒマラヤ岩塩","毛織物"],"lake"), world("sri_lanka","スリランカ",["セイロンティー","宝石"],"sea"),
  world("uae","アラブ首長国連邦",["デーツ","香水瓶"],"sea"), world("turkey","トルコ",["ターキッシュデライト","青い護符"],"sea"),
  world("greece","ギリシャ",["オリーブ","陶器"],"sea"), world("italy","イタリア",["パスタ","ベネチアングラス"],"sea"),
  world("spain","スペイン",["オリーブオイル","扇子"],"sea"), world("portugal","ポルトガル",["カステラ","コルク細工"],"sea"),
  world("france","フランス",["マカロン","香水"],"river"), world("united_kingdom","イギリス",["紅茶","ショートブレッド"],"sea"),
  world("ireland","アイルランド",["ウール","クローバー飾り"],"sea"), world("netherlands","オランダ",["チーズ","木靴"],"river"),
  world("belgium","ベルギー",["チョコレート","レース"],"river"), world("germany","ドイツ",["プレッツェル","木工人形"],"river"),
  world("switzerland","スイス",["チーズ","時計"],"lake"), world("austria","オーストリア",["ザッハトルテ","音楽箱"],"river"),
  world("czechia","チェコ",["ボヘミアガラス","蜂蜜菓子"],"river"), world("poland","ポーランド",["琥珀","陶器"],"lake"),
  world("denmark","デンマーク",["クッキー","人魚の置物"],"sea"), world("norway","ノルウェー",["サーモン","木彫り船"],"sea"),
  world("sweden","スウェーデン",["ベリージャム","ダーラナホース"],"lake"), world("finland","フィンランド",["ベリー","トナカイ飾り"],"lake"),
  world("iceland","アイスランド",["溶岩塩","ウール帽"],"sea"), world("egypt","エジプト",["デーツ","パピルス"],"river"),
  world("morocco","モロッコ",["ミントティー","モザイク皿"],"sea"), world("kenya","ケニア",["コーヒー","ビーズ細工"],"lake"),
  world("tanzania","タンザニア",["スパイス","木彫り動物"],"lake"), world("south_africa","南アフリカ",["ルイボスティー","宝石"],"sea"),
  world("canada","カナダ",["メープルシロップ","氷河石"],"lake"), world("united_states","アメリカ",["アップルパイ","星形バッジ"],"river"),
  world("mexico","メキシコ",["カカオ","銀細工"],"sea"), world("peru","ペルー",["アルパカ毛織物","紫トウモロコシ"],"river"),
  world("brazil","ブラジル",["コーヒー豆","カーニバル羽根"],"river"), world("argentina","アルゼンチン",["マテ茶","革細工"],"sea"),
  world("chile","チリ",["海塩","ラピスラズリ"],"sea"), world("australia","オーストラリア",["マカダミアナッツ","オパール"],"sea"),
  world("new_zealand","ニュージーランド",["マヌカハニー","翡翠飾り"],"sea"), world("antarctica","南極",["永久氷晶","オーロラの欠片"],"sea"),
];

export const SPACE_AREAS: AreaSeed[] = [
  space("moon","月面・静かの海",["月の砂","隕鉄"],"sea"), space("lunar_ice","月の氷洞",["月氷晶","青白い鉱石"],"lake"),
  space("mercury","水星灼熱帯",["太陽石","水銀結晶"],"river"), space("venus_cloud","金星雲海",["硫黄真珠","雲の結晶"],"sea"),
  space("venus_night","金星夜面",["夜光石","耐熱繊維"],"lake"), space("mars_canal","火星運河",["赤砂結晶","火星苔"],"river"),
  space("mars_pole","火星極冠",["ドライアイス晶","古代氷"],"lake"), space("phobos","フォボス裂谷",["衛星石","無重力砂"],"pond"),
  space("deimos","ダイモス静海",["静寂石","星屑貝"],"sea"), space("asteroid_belt","小惑星帯",["ニッケル隕石","小惑星真珠"],"river"),
  space("ceres","ケレス地下海",["塩氷","白い噴出石"],"sea"), space("vesta","ベスタ火口湖",["玄武宇宙岩","炎晶"],"lake"),
  space("jupiter_cloud","木星大雲海",["嵐の雫","縞雲石"],"sea"), space("great_red_spot","大赤斑",["赤嵐核","雷雲結晶"],"pond"),
  space("io","イオ溶岩海",["火山硫黄","溶岩真珠"],"river"), space("europa","エウロパ氷底海",["氷殻片","生命の泡"],"sea"),
  space("ganymede","ガニメデ磁気海",["磁鉄晶","青氷"],"lake"), space("callisto","カリスト古代海",["古代隕石","黒氷晶"],"sea"),
  space("saturn_ring","土星環流",["環の氷粒","黄金ガス晶"],"river"), space("titan","タイタン・メタン海",["メタン真珠","橙霧石"],"sea"),
  space("enceladus","エンケラドス噴泉",["噴泉氷","白銀塩"],"river"), space("mimas","ミマス大火口",["火口石","凍結塵"],"pond"),
  space("uranus","天王星の蒼海",["蒼風晶","氷雲石"],"sea"), space("titania","チタニア渓谷",["妖精氷","断層石"],"river"),
  space("neptune","海王星暴風海",["深青晶","超風圧石"],"sea"), space("triton","トリトン窒素泉",["窒素氷","桃色雪"],"river"),
  space("pluto","冥王星ハート平原",["冥氷","ハート石"],"lake"), space("charon","カロン暗黒峡谷",["暗黒氷","双星石"],"river"),
  space("kuiper","カイパーベルト",["原始氷塊","彗星核"],"sea"), space("comet","彗星の尾",["星氷","光る塵"],"river"),
  space("solar_wind","太陽風海流",["陽子結晶","光帆布"],"river"), space("solar_corona","太陽コロナ",["紅炎石","光子珠"],"sea"),
  space("alpha_centauri","アルファ・ケンタウリ",["三連星晶","黄金惑星砂"],"lake"), space("proxima_b","プロキシマb",["赤星苔","潮汐石"],"sea"),
  space("sirius","シリウス光海",["白星真珠","蒼光石"],"sea"), space("vega","ベガ琴線湖",["音光晶","七夕の糸"],"lake"),
  space("betelgeuse","ベテルギウス紅海",["巨星灰","紅色核片"],"sea"), space("pleiades","すばる星雲",["七星砂","青雲花"],"lake"),
  space("orion","オリオン大星雲",["星雲珊瑚","狩人石"],"sea"), space("horsehead","馬頭暗黒雲",["暗黒塵","影の蹄鉄"],"pond"),
  space("andromeda","アンドロメダ銀河",["銀河真珠","渦巻晶"],"sea"), space("magellanic","マゼラン雲",["航海星図","雲河石"],"lake"),
  space("supernova","超新星残骸",["超新星核","虹色ガス"],"river"), space("neutron_star","中性子星潮流",["超密度石","パルサー時計"],"river"),
  space("black_hole","ブラックホール縁",["重力晶","事象の欠片"],"pond"), space("wormhole","ワームホール",["時空糸","異次元真珠"],"river"),
  space("dark_matter","暗黒物質海",["不可視石","影エネルギー"],"sea"), space("cosmic_web","宇宙大網",["銀河糸","宇宙泡"],"river"),
  space("edge_universe","宇宙の果て",["終端結晶","始原の光"],"sea"), space("origin_ocean","始まりの宇宙海",["創世の雫","無限星核"],"sea"),
];

export const ALL_AREA_SEEDS: AreaSeed[] = [...JAPAN_AREAS, ...WORLD_AREAS, ...SPACE_AREAS];
