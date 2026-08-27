import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../src/constants/theme";

const iconMap:Record<string,keyof typeof Ionicons.glyphMap>={map:"map-outline",steps:"footsteps",walk:"person-circle",fish:"fish",shop:"bag-handle"};

export default function TabsLayout(){
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:colors.coral,tabBarInactiveTintColor:colors.muted,tabBarStyle:{height:62+insets.bottom,paddingTop:7,paddingBottom:Math.max(insets.bottom,8)},tabBarLabelStyle:{fontWeight:"700"},tabBarIcon:({color,size})=><Ionicons name={iconMap[route.name]??"ellipse"} color={color} size={size}/>})}>
    <Tabs.Screen name="map" options={{title:"エリア"}}/>
    <Tabs.Screen name="steps" options={{title:"歩数"}}/>
    <Tabs.Screen name="walk" options={{title:"マイ"}}/>
    <Tabs.Screen name="fish" options={{title:"釣る",tabBarStyle:{display:"none"}}}/>
    <Tabs.Screen name="shop" options={{title:"交換"}}/>
  </Tabs>;
}
