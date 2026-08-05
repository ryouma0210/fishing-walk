import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Header, Screen } from "../src/components/ui";
import { colors } from "../src/constants/theme";

function manualGuides() { return [
  { title: "1. エリアを選ぶ", text: "下から上へ進みます。ヌシを釣ると次のエリアが解放されます。", art: <View style={styles.routeArt}><Text style={styles.routeNode}>🎣</Text><View style={styles.routeLine}/><Text style={styles.routeNode}>🔒</Text><View style={styles.routeLine}/><Text style={styles.routeNode}>👑</Text></View> },
  { title: "2. 餌を選んで投げる", text: "餌ごとに狙えるランクが異なります。投げるたびに餌を1個消費します。", art: <View style={styles.baitArt}><Text style={styles.bigEmoji}>🪱</Text><Text style={styles.arrow}>→</Text><Text style={styles.bigEmoji}>🎣</Text><Text style={styles.arrow}>→</Text><Text style={styles.bigEmoji}>🐟</Text></View> },
  { title: "3. ウキに合わせる", text: "接近ゲージが100%になりウキが沈んだら、「今だ！合わせる」を押します。", art: <View style={styles.approachArt}><View style={styles.approachGreen}/><View style={styles.approachYellow}/><View style={styles.approachRed}/><Text style={styles.approachFish}>🐟</Text><Text style={styles.approachHook}>🪝</Text></View> },
  { title: "4. リールで巻き寄せる", text: "長押しで魚を左へ引き寄せ、離すと右へ逃げます。緑枠内を維持してください。", art: <View><View style={styles.battleArt}><Text style={styles.person}>🧍</Text><View style={styles.safeZone}/><Text style={styles.fish}>🐟</Text></View><Text style={styles.artCaption}>近い・安全　　　　　　　　　遠い・危険</Text></View> },
  { title: "5. ヌシとの3段階バトル", text: "ヌシ戦は3段階。段階が進むほど安全範囲が狭まり、一定時間ごとに大暴れします。", art: <View style={styles.stageArt}>{[1,2,3].map((stage)=><View key={stage} style={[styles.stage, stage === 3 && styles.finalStage]}><Text style={styles.stageText}>PHASE {stage}</Text></View>)}</View> },
  { title: "6. 全国図鑑と装備", text: "釣った魚と名産物は都道府県別の図鑑へ登録。歩数ポイントで竿・リール・衣装一式・餌を交換できます。", art: <View style={styles.baitArt}><Text style={styles.bigEmoji}>🐠</Text><Text style={styles.arrow}>→</Text><Text style={styles.bigEmoji}>🗾</Text><Text style={styles.arrow}>＋</Text><Text style={styles.bigEmoji}>⚙️</Text></View> },
]; }

export default function ManualScreen() {
  const router = useRouter();
  const guides = manualGuides();
  return <Screen>
    <View style={styles.topRow}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={styles.headerBody}><Header title="遊び方" sub="Fishing Walk 図解マニュアル" /></View></View>
    {guides.map((guide) => <Card key={guide.title} style={styles.guide}><Text style={styles.title}>{guide.title}</Text><View style={styles.art}>{guide.art}</View><Text style={styles.text}>{guide.text}</Text></Card>)}
  </Screen>;
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "flex-start" }, back: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 3, backgroundColor: colors.foam }, backText: { color: colors.navy, fontSize: 31, lineHeight: 32 }, headerBody: { flex: 1 },
  guide: { gap: 10 }, title: { color: colors.navy, fontSize: 18, fontWeight: "900" }, text: { color: colors.ink, fontSize: 12, lineHeight: 19 }, art: { minHeight: 82, borderRadius: 16, padding: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF7F6" },
  routeArt: { flexDirection: "row", alignItems: "center" }, routeNode: { fontSize: 27 }, routeLine: { width: 48, height: 5, borderRadius: 9, backgroundColor: colors.gold },
  baitArt: { flexDirection: "row", alignItems: "center", gap: 14 }, bigEmoji: { fontSize: 33 }, arrow: { color: colors.ocean, fontSize: 22, fontWeight: "900" },
  approachArt: { width: "100%", height: 43, borderRadius: 10, overflow: "hidden", flexDirection: "row", borderWidth: 2, borderColor: colors.navy }, approachGreen: { flex: 1, backgroundColor: "#43D94D" }, approachYellow: { flex: 1, backgroundColor: "#F4D83D" }, approachRed: { flex: 1, backgroundColor: "#FF654F" }, approachFish: { position: "absolute", left: "55%", top: 7, fontSize: 20 }, approachHook: { position: "absolute", right: 6, top: 7, fontSize: 20 },
  battleArt: { width: "100%", height: 47, borderRadius: 10, overflow: "hidden", backgroundColor: "#FF6858", borderWidth: 2, borderColor: colors.navy }, person: { position: "absolute", left: 5, top: 8, fontSize: 22, zIndex: 2 }, safeZone: { position: "absolute", left: "12%", width: "35%", top: 2, bottom: 2, borderRadius: 8, backgroundColor: "#42D96B", borderWidth: 2, borderColor: "#058C62" }, fish: { position: "absolute", left: "38%", top: 8, fontSize: 22 }, artCaption: { color: colors.muted, fontSize: 8, marginTop: 4 },
  stageArt: { width: "100%", flexDirection: "row", gap: 7 }, stage: { flex: 1, height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.ocean }, finalStage: { backgroundColor: colors.coral }, stageText: { color: colors.white, fontSize: 9, fontWeight: "900" },
});
