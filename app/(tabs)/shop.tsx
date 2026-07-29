import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { SHOP } from "../../src/constants/game";
import { buyItem, db, equipItem, getCoins } from "../../src/database/db";
import { colors } from "../../src/constants/theme";
export default function ShopScreen(){
 const [coins,setCoins]=useState(0),[owned,setOwned]=useState<Record<string,number>>({});
 const load=useCallback(async()=>{setCoins(await getCoins());const r=await (await db()).getAllAsync<{item_id:string;equipped:number}>("SELECT item_id,equipped FROM inventory");setOwned(Object.fromEntries(r.map(x=>[x.item_id,x.equipped])));},[]);
 useFocusEffect(useCallback(()=>{load();},[load]));
 const act=async(id:string)=>{const item=SHOP.find(x=>x.id===id)!;if(owned[id]!==undefined){await equipItem(id,item.kind,SHOP.filter(x=>x.kind===item.kind).map(x=>x.id));await load();return;}const ok=await buyItem(id,item.cost);if(!ok)Alert.alert("交換できません","コインが不足しています。");await load();};
 return <Screen><Header title="Gear Exchange" sub={`所持コイン ${coins.toLocaleString()} 🪙`}/><Card><Text style={ui.h2}>装備中</Text><Text style={ui.body}>{SHOP.filter(x=>owned[x.id]===1).map(x=>`${x.emoji}${x.name}`).join("　")||"初期装備"}</Text></Card>{SHOP.map(x=><Card key={x.id}><View style={s.item}><Text style={s.emoji}>{x.emoji}</Text><View style={s.info}><Text style={ui.h2}>{x.name}</Text><Text style={ui.body}>{x.description}</Text><Text style={s.cost}>{x.cost} 🪙</Text></View></View><Button title={owned[x.id]===1?"装備中":owned[x.id]!==undefined?"装備する":"交換する"} onPress={()=>act(x.id)} disabled={owned[x.id]===1} kind={owned[x.id]!==undefined?"secondary":"primary"}/></Card>)}</Screen>
}
const s=StyleSheet.create({item:{flexDirection:"row",gap:14,marginBottom:12},emoji:{fontSize:42},info:{flex:1},cost:{fontWeight:"900",color:colors.coral,marginTop:5}});
