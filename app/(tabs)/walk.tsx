import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pedometer } from "expo-sensors";
import { useFocusEffect } from "expo-router";
import { Card, Header, Screen, ui } from "../../src/components/ui";
import { colors } from "../../src/constants/theme";
import { db, saveSteps } from "../../src/database/db";
const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export default function WalkScreen(){
  const [today,setToday]=useState(0); const [days,setDays]=useState<{day:string;steps:number}[]>([]);
  const baseSteps=useRef(0);
  const load=useCallback(async()=>{const now=new Date();const start=new Date(now);start.setHours(0,0,0,0);try{const available=await Pedometer.isAvailableAsync();if(available){const r=await Pedometer.getStepCountAsync(start,now);baseSteps.current=r.steps;setToday(r.steps);await saveSteps(dayKey(now),r.steps);}}catch{} const rows=await (await db()).getAllAsync<{day:string;steps:number}>("SELECT day,steps FROM step_days ORDER BY day DESC LIMIT 31");setDays(rows.reverse());},[]);
  useFocusEffect(useCallback(()=>{load();},[load]));
  useEffect(()=>{const sub=Pedometer.watchStepCount(r=>setToday(baseSteps.current+r.steps));return()=>sub.remove();},[]);
  const max=Math.max(10000,...days.map(x=>x.steps)); const month=days.reduce((a,b)=>a+b.steps,0);
  return <Screen><Header title="Walk Report" sub="端末のモーション／歩数データから集計"/><Card><Text style={ui.muted}>今日の歩数</Text><Text style={ui.metric}>{today.toLocaleString()} <Text style={s.unit}>歩</Text></Text><View style={s.track}><View style={[s.progress,{width:`${Math.min(100,today/100)}%`}]}/></View><Text style={ui.muted}>目標 10,000歩 ・ 達成率 {Math.min(100,Math.round(today/100))}%</Text></Card>
  <Card><View style={ui.between}><Text style={ui.h2}>今月</Text><Text style={s.month}>{month.toLocaleString()}歩</Text></View><View style={s.chart}>{days.length?days.map((x,i)=><View key={x.day} style={s.barCell}><View style={[s.bar,{height:Math.max(3,90*x.steps/max)}]}/>{(i%5===0||i===days.length-1)&&<Text style={s.label}>{Number(x.day.slice(8))}</Text>}</View>):<Text style={ui.muted}>歩数データは歩いた後に表示されます</Text>}</View></Card>
  <Card><Text style={ui.h2}>歩いて得られるもの</Text><Text style={ui.body}>1,000歩ごとに釣りゲームのレア魚抽選が少し有利になります。歩数は端末内にだけ保存され、サーバーへ送信しません。</Text></Card></Screen>;
}
const s=StyleSheet.create({unit:{fontSize:16},track:{height:10,borderRadius:8,backgroundColor:colors.line,overflow:"hidden",marginVertical:8},progress:{height:"100%",backgroundColor:colors.aqua},month:{fontWeight:"900",color:colors.ocean},chart:{height:120,flexDirection:"row",alignItems:"flex-end",gap:2,marginTop:12},barCell:{flex:1,height:110,alignItems:"center",justifyContent:"flex-end"},bar:{width:"80%",backgroundColor:colors.aqua,borderRadius:4},label:{fontSize:8,color:colors.muted,height:12}});
