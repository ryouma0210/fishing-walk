import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { db } from "../src/database/db";

export default function RootLayout() {
  useEffect(()=>{ db().catch(console.error); },[]);
  return <><StatusBar style="dark"/><Stack screenOptions={{headerShown:false}}/></>;
}
