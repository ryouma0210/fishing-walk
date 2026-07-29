import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Header, Screen, ui } from "../../src/components/ui";
import { FISH } from "../../src/constants/game";
import { db } from "../../src/database/db";
import { colors, rankColors } from "../../src/constants/theme";
type CatchRow={fish_id:string;count:number;max_size:number;aquarium:string;rank:string};
export default function Aquarium(){
 const [rows,setRows]=useState<CatchRow[]>([]);
 useFocusEffect(useCallback(()=>{db().then(x=>x.getAllAsync<CatchRow>("SELECT fish_id,COUNT(*) count,MAX(size_cm) max_size,aquarium,rank FROM catches GROUP BY fish_id ORDER BY MAX(caught_at) DESC")).then(setRows);},[]));
 const aquariums=[...new Set(FISH.map(x=>x.aquarium))];
 return <Screen><Header title="My Aquarium" sub={`図鑑 ${rows.length} / ${FISH.length} 種`}/>{aquariums.map(a=>{const found=rows.filter(x=>x.aquarium===a);return <Card key={a}><View style={ui.between}><Text style={ui.h2}>{a}</Text><Text style={ui.muted}>{found.length}/{FISH.filter(x=>x.aquarium===a).length}</Text></View><View style={s.grid}>{FISH.filter(x=>x.aquarium===a).map(f=>{const c=rows.find(x=>x.fish_id===f.id);return <View key={f.id} style={[s.fishCard,!c&&s.locked]}><Text style={s.emoji}>{c?f.emoji:"?"}</Text><Text style={s.fishName}>{c?f.name:"未発見"}</Text>{c&&<><Text style={[s.rank,{color:rankColors[f.rank]}]}>{f.rank} × {c.count}</Text><Text style={ui.muted}>最大 {c.max_size}cm</Text></>}</View>})}</View></Card>})}</Screen>
}
const s=StyleSheet.create({grid:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12},fishCard:{width:"48%",backgroundColor:colors.foam,borderRadius:14,padding:12,alignItems:"center"},locked:{opacity:.5},emoji:{fontSize:36},fishName:{fontWeight:"800",color:colors.ink,marginTop:4},rank:{fontSize:12,fontWeight:"900"}});
