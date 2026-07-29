import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/constants/theme";
const iconMap:Record<string,keyof typeof Ionicons.glyphMap>={map:"map",walk:"footsteps",fish:"fish",aquarium:"water",shop:"bag-handle"};
export default function TabsLayout(){
  return <Tabs screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.coral,tabBarInactiveTintColor:colors.muted,tabBarStyle:{height:72,paddingTop:7,paddingBottom:10},tabBarLabelStyle:{fontWeight:"700"},tabBarIcon:({color,size})=><Ionicons name={iconMap[route.name]??"ellipse"} color={color} size={size}/>})}>
    <Tabs.Screen name="map" options={{title:"マップ"}}/><Tabs.Screen name="walk" options={{title:"歩数"}}/>
    <Tabs.Screen name="fish" options={{title:"釣る"}}/><Tabs.Screen name="aquarium" options={{title:"水族館"}}/>
    <Tabs.Screen name="shop" options={{title:"交換"}}/>
  </Tabs>;
}
