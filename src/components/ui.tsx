import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/theme";

export function Screen({children,scroll=true}:{children:ReactNode;scroll?:boolean}) {
  const body = scroll ? <ScrollView contentContainerStyle={s.content}>{children}</ScrollView> : <View style={s.content}>{children}</View>;
  return <SafeAreaView style={s.safe} edges={["top"]}>{body}</SafeAreaView>;
}
export function Header({title,sub}:{title:string;sub?:string}) { return <View style={s.header}><Text style={s.title}>{title}</Text>{sub&&<Text style={s.sub}>{sub}</Text>}</View>; }
export function Card({children,style}:{children:ReactNode;style?:ViewStyle}) { return <View style={[s.card,style]}>{children}</View>; }
export function Button({title,onPress,disabled=false,kind="primary"}:{title:string;onPress:()=>void;disabled?:boolean;kind?:"primary"|"secondary"}) {
  return <Pressable onPress={onPress} disabled={disabled} style={({pressed})=>[s.button,kind==="secondary"&&s.secondary,(pressed||disabled)&&s.dim]}><Text style={[s.buttonText,kind==="secondary"&&s.secondaryText]}>{title}</Text></Pressable>;
}
export const ui = StyleSheet.create({
  row:{flexDirection:"row",alignItems:"center"}, between:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  h2:{fontSize:18,fontWeight:"800",color:colors.ink}, body:{fontSize:14,color:colors.ink}, muted:{fontSize:12,color:colors.muted},
  metric:{fontSize:32,fontWeight:"900",color:colors.navy}, chip:{paddingHorizontal:10,paddingVertical:5,borderRadius:99,backgroundColor:colors.foam},
});
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F4FAF9"},content:{padding:16,paddingBottom:110,gap:12,flexGrow:1},
  header:{marginBottom:2},title:{fontSize:27,fontWeight:"900",color:colors.navy},sub:{fontSize:13,color:colors.muted,marginTop:2},
  card:{backgroundColor:colors.white,borderRadius:20,padding:16,borderWidth:1,borderColor:colors.line,shadowColor:"#063B4C",shadowOpacity:.07,shadowRadius:10,shadowOffset:{width:0,height:4}},
  button:{backgroundColor:colors.coral,paddingVertical:13,paddingHorizontal:18,borderRadius:14,alignItems:"center"},buttonText:{color:"white",fontSize:15,fontWeight:"800"},
  secondary:{backgroundColor:colors.foam,borderWidth:1,borderColor:colors.aqua},secondaryText:{color:colors.navy},dim:{opacity:.45}
});
