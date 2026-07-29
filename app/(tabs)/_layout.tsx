import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../src/constants/theme";

const iconMap:Record<string,keyof typeof Ionicons.glyphMap>={map:"map",walk:"footsteps",fish:"fish",aquarium:"water",shop:"bag-handle"};

export default function TabsLayout(){
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.coral,tabBarInactiveTintColor:colors.muted,tabBarStyle:{height:62+insets.bottom,paddingTop:7,paddingBottom:Math.max(insets.bottom,8)},tabBarLabelStyle:{fontWeight:"700"},tabBarIcon:({color,size})=><Ionicons name={iconMap[route.name]??"ellipse"} color={color} size={size}/>})}>
    <Tabs.Screen name="map" options={{title:"マップ"}}/><Tabs.Screen name="walk" options={{title:"歩数"}}/>
    <Tabs.Screen name="fish" options={{title:"釣る"}}/><Tabs.Screen name="aquarium" options={{title:"水族館"}}/>
    <Tabs.Screen name="shop" options={{title:"交換"}}/>
  </Tabs>;
}
