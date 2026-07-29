import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { FISH, RANKS, SHOP } from "../../src/constants/game";
import { colors, rankColors } from "../../src/constants/theme";
import { getCoins, getGearBonus, saveCatch, db } from "../../src/database/db";
export default function FishScreen(){
  const [coins,setCoins]=useState(0),[casting,setCasting]=useState(false),[last,setLast]=useState<{name:string;emoji:string;rank:string;size:number;reward:number}|null>(null),[steps,setSteps]=useState(0);
  const load=useCallback(async()=>{setCoins(await getCoins());const row=await (await db()).getFirstAsync<{steps:number}>("SELECT steps FROM step_days ORDER BY day DESC LIMIT 1");setSteps(row?.steps??0);},[]);
  useFocusEffect(useCallback(()=>{load();},[load]));
  const cast=async()=>{setCasting(true);setLast(null);setTimeout(async()=>{const equipped=await getGearBonus();const gear=SHOP.filter(x=>equipped.includes(x.id)).reduce((a,b)=>a+b.bonus,0);const luck=Math.min(7,Math.floor(steps/3000)+gear);const roll=Math.random()*100+luck*3;const ri=roll>112?7:roll>104?6:roll>96?5:roll>84?4:roll>67?3:roll>45?2:roll>22?1:0;const pool=FISH.filter(f=>RANKS.indexOf(f.rank)<=ri);const fish=pool[Math.floor(Math.random()*pool.length)];const size=Number((fish.minCm+Math.random()*(fish.maxCm-fish.minCm)*(1+gear*.03)).toFixed(1));const reward=10+RANKS.indexOf(fish.rank)*18+Math.round(size/10);await saveCatch(fish.id,size,fish.rank,fish.aquarium,reward);setLast({...fish,size,reward});setCoins(await getCoins());setCasting(false);},1100);};
  return <Screen><Header title="Fishing Game" sub={`所持コイン ${coins.toLocaleString()} 🪙`}/><Card style={s.hero}><Text style={s.water}>{casting?"〜 〜 〰️ 〜 〜":"🌊  〜  🎣  〜  🌊"}</Text><Text style={s.hint}>{casting?"魚が食いつくのを待っています…":"歩数と装備で大物率アップ"}</Text><Button title={casting?"キャスト中…":"釣り糸を投げる"} onPress={cast} disabled={casting}/></Card>
  {last&&<Card><View style={s.catch}><Text style={s.fish}>{last.emoji}</Text><View><Text style={[s.rank,{color:rankColors[last.rank]}]}>{last.rank} RANK</Text><Text style={s.name}>{last.name}</Text><Text style={ui.body}>{last.size} cm　+{last.reward} 🪙</Text></View></View><Text style={ui.muted}>水族館へ自動で格納しました</Text></Card>}
  <Card><Text style={ui.h2}>ランク抽選</Text><View style={s.ranks}>{RANKS.map(x=><View key={x} style={[s.rankPill,{backgroundColor:rankColors[x]}]}><Text style={s.rankText}>{x}</Text></View>)}</View><Text style={ui.body}>EからSSSまで全10種。マスターロッドや餌、クーラーを交換して伝説級の大物に挑戦しましょう。</Text></Card></Screen>;
}
const s=StyleSheet.create({hero:{gap:18,alignItems:"stretch",paddingVertical:26},water:{fontSize:32,textAlign:"center"},hint:{textAlign:"center",color:colors.muted,fontWeight:"700"},catch:{flexDirection:"row",gap:18,alignItems:"center",marginBottom:12},fish:{fontSize:62},rank:{fontWeight:"900",fontSize:13},name:{fontSize:25,fontWeight:"900",color:colors.ink},ranks:{flexDirection:"row",gap:5,marginVertical:12,flexWrap:"wrap"},rankPill:{borderRadius:9,minWidth:34,padding:7,alignItems:"center"},rankText:{color:"white",fontWeight:"900"}});
