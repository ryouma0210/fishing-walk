import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Header, Screen } from "../../src/components/ui";
import { colors } from "../../src/constants/theme";

type Spot={name:string;kind:string;emoji:string;lat:number;lng:number};
export default function MapScreen(){
  const [region,setRegion]=useState<Region>({latitude:35.6812,longitude:139.7671,latitudeDelta:.035,longitudeDelta:.035});
  const [permission,setPermission]=useState("確認中");
  useEffect(()=>{(async()=>{const p=await Location.requestForegroundPermissionsAsync();if(p.status!=="granted"){setPermission("位置情報が許可されていません");return;} const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});setRegion(r=>({...r,latitude:pos.coords.latitude,longitude:pos.coords.longitude}));setPermission("現在地を表示中");})().catch(()=>setPermission("現在地を取得できませんでした"));},[]);
  const spots:Spot[]=[
    {name:"みずべ公園",kind:"pond",emoji:"🌿",lat:region.latitude+.006,lng:region.longitude+.004},
    {name:"ウォーク川",kind:"river",emoji:"🏞️",lat:region.latitude-.005,lng:region.longitude+.006},
    {name:"青空湖",kind:"lake",emoji:"⛰️",lat:region.latitude+.004,lng:region.longitude-.007},
    {name:"潮風堤防",kind:"sea",emoji:"🌊",lat:region.latitude-.008,lng:region.longitude-.005},
  ];
  return <Screen scroll={false}><Header title="Fishing Map" sub={permission}/><View style={s.mapWrap}><MapView style={s.map} provider={Platform.OS==="android"?PROVIDER_GOOGLE:undefined} region={region} onRegionChangeComplete={setRegion} showsUserLocation showsMyLocationButton>
    {spots.map(x=><Marker key={x.name} coordinate={{latitude:x.lat,longitude:x.lng}} title={`${x.emoji} ${x.name}`} description="近くで釣りに挑戦できます"/>)}
  </MapView><View style={s.legend}><Text style={s.legendText}>📍 歩いて釣り場をめぐろう</Text></View></View></Screen>;
}
const s=StyleSheet.create({mapWrap:{flex:1,borderRadius:22,overflow:"hidden",borderWidth:1,borderColor:colors.line},map:{flex:1},legend:{position:"absolute",left:12,right:12,bottom:12,backgroundColor:"rgba(6,59,76,.9)",padding:12,borderRadius:14},legendText:{color:"white",fontWeight:"800",textAlign:"center"}});
