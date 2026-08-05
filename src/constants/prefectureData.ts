export type PrefectureSeed = {
  slug: string;
  name: string;
  products: [string, string];
  habitat: "pond" | "river" | "lake" | "sea";
};

const PREFECTURE_MASTER: PrefectureSeed[] = [
  { slug:"hokkaido",name:"北海道",products:["夕張メロン","毛ガニ"],habitat:"sea" },
  { slug:"aomori",name:"青森県",products:["りんご","にんにく"],habitat:"lake" },
  { slug:"iwate",name:"岩手県",products:["わんこそば","南部せんべい"],habitat:"river" },
  { slug:"miyagi",name:"宮城県",products:["牛たん","笹かまぼこ"],habitat:"sea" },
  { slug:"akita",name:"秋田県",products:["きりたんぽ","稲庭うどん"],habitat:"lake" },
  { slug:"yamagata",name:"山形県",products:["さくらんぼ","ラ・フランス"],habitat:"river" },
  { slug:"fukushima",name:"福島県",products:["桃","喜多方ラーメン"],habitat:"lake" },
  { slug:"ibaraki",name:"茨城県",products:["納豆","メロン"],habitat:"pond" },
  { slug:"tochigi",name:"栃木県",products:["いちご","餃子"],habitat:"river" },
  { slug:"gunma",name:"群馬県",products:["こんにゃく","焼きまんじゅう"],habitat:"river" },
  { slug:"saitama",name:"埼玉県",products:["草加せんべい","深谷ねぎ"],habitat:"pond" },
  { slug:"chiba",name:"千葉県",products:["落花生","梨"],habitat:"sea" },
  { slug:"tokyo",name:"東京都",products:["江戸前寿司","人形焼"],habitat:"sea" },
  { slug:"kanagawa",name:"神奈川県",products:["しゅうまい","かまぼこ"],habitat:"sea" },
  { slug:"niigata",name:"新潟県",products:["コシヒカリ","笹団子"],habitat:"river" },
  { slug:"toyama",name:"富山県",products:["ます寿司","白えび"],habitat:"sea" },
  { slug:"ishikawa",name:"石川県",products:["金箔","加賀れんこん"],habitat:"sea" },
  { slug:"fukui",name:"福井県",products:["越前がに","羽二重餅"],habitat:"sea" },
  { slug:"yamanashi",name:"山梨県",products:["ぶどう","ほうとう"],habitat:"lake" },
  { slug:"nagano",name:"長野県",products:["信州そば","野沢菜"],habitat:"river" },
  { slug:"gifu",name:"岐阜県",products:["飛騨牛","栗きんとん"],habitat:"river" },
  { slug:"shizuoka",name:"静岡県",products:["お茶","うなぎ"],habitat:"sea" },
  { slug:"aichi",name:"愛知県",products:["八丁味噌","ういろう"],habitat:"sea" },
  { slug:"mie",name:"三重県",products:["伊勢えび","赤福"],habitat:"sea" },
  { slug:"shiga",name:"滋賀県",products:["近江牛","鮒ずし"],habitat:"lake" },
  { slug:"kyoto",name:"京都府",products:["八つ橋","宇治茶"],habitat:"river" },
  { slug:"osaka",name:"大阪府",products:["たこ焼き","お好み焼き"],habitat:"sea" },
  { slug:"hyogo",name:"兵庫県",products:["神戸牛","明石焼き"],habitat:"sea" },
  { slug:"nara",name:"奈良県",products:["柿の葉寿司","奈良漬"],habitat:"pond" },
  { slug:"wakayama",name:"和歌山県",products:["梅干し","みかん"],habitat:"sea" },
  { slug:"tottori",name:"鳥取県",products:["二十世紀梨","らっきょう"],habitat:"sea" },
  { slug:"shimane",name:"島根県",products:["出雲そば","しじみ"],habitat:"lake" },
  { slug:"okayama",name:"岡山県",products:["白桃","きびだんご"],habitat:"sea" },
  { slug:"hiroshima",name:"広島県",products:["もみじ饅頭","牡蠣"],habitat:"sea" },
  { slug:"yamaguchi",name:"山口県",products:["ふぐ","外郎"],habitat:"sea" },
  { slug:"tokushima",name:"徳島県",products:["すだち","鳴門金時"],habitat:"river" },
  { slug:"kagawa",name:"香川県",products:["讃岐うどん","和三盆"],habitat:"sea" },
  { slug:"ehime",name:"愛媛県",products:["みかん","鯛めし"],habitat:"sea" },
  { slug:"kochi",name:"高知県",products:["かつおのたたき","ゆず"],habitat:"sea" },
  { slug:"fukuoka",name:"福岡県",products:["明太子","博多ラーメン"],habitat:"sea" },
  { slug:"saga",name:"佐賀県",products:["佐賀牛","丸ぼうろ"],habitat:"sea" },
  { slug:"nagasaki",name:"長崎県",products:["カステラ","ちゃんぽん"],habitat:"sea" },
  { slug:"kumamoto",name:"熊本県",products:["馬刺し","からし蓮根"],habitat:"river" },
  { slug:"oita",name:"大分県",products:["かぼす","とり天"],habitat:"sea" },
  { slug:"miyazaki",name:"宮崎県",products:["マンゴー","チキン南蛮"],habitat:"sea" },
  { slug:"kagoshima",name:"鹿児島県",products:["黒豚","さつま揚げ"],habitat:"sea" },
  { slug:"okinawa",name:"沖縄県",products:["ちんすこう","紅いも"],habitat:"sea" },
];

// 長崎から北上して北海道へ到達し、最後に沖縄へ渡るゲーム進行順。
const RELEASE_ORDER = [
  "nagasaki", "saga", "fukuoka", "oita", "kumamoto", "miyazaki", "kagoshima",
  "yamaguchi", "shimane", "tottori", "hiroshima", "okayama",
  "ehime", "kagawa", "tokushima", "kochi",
  "hyogo", "osaka", "wakayama", "nara", "kyoto", "shiga",
  "mie", "aichi", "shizuoka", "gifu", "fukui", "ishikawa", "toyama", "nagano", "yamanashi", "niigata",
  "kanagawa", "tokyo", "chiba", "saitama", "gunma", "tochigi", "ibaraki",
  "fukushima", "yamagata", "miyagi", "akita", "iwate", "aomori", "hokkaido",
  "okinawa",
] as const;

export const PREFECTURES: PrefectureSeed[] = RELEASE_ORDER.map((slug) => {
  const prefecture = PREFECTURE_MASTER.find((entry) => entry.slug === slug);
  if (!prefecture) throw new Error(`Unknown prefecture: ${slug}`);
  return prefecture;
});
