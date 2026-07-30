import { useCallback, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { AnglerArt, GearArt } from "../../src/components/GameArt";
import { DEFAULT_GEAR, GearKind, SHOP } from "../../src/constants/game";
import {
  buyBait, buyItem, equipItem, equipOutfitSet, getBaitInventory, getInventory, getWalkPoints,
  InventoryRow, selectBait, unequipKind, unequipOutfit,
} from "../../src/database/db";
import { colors } from "../../src/constants/theme";

const KIND_NAMES: Record<GearKind, string> = {
  hat: "帽子", top: "服", bottom: "ズボン", shoes: "靴",
  rod: "竿", reel: "リール", bait: "餌", cooler: "クーラー",
};
const KINDS = Object.keys(KIND_NAMES) as GearKind[];
const DEFAULT_ICONS: Record<GearKind, string> = {
  hat:"◯", top:"👕", bottom:"👖", shoes:"👟", rod:"🎣", reel:"⚙️", bait:"🪱", cooler:"🧊",
};
const APPAREL_KINDS: GearKind[] = ["hat", "top", "bottom", "shoes"];
const OUTFIT_NAMES = ["ライトアングラー", "ウォータープルーフ", "ストームフィッシャー", "海王スタイル"];

export default function ShopScreen() {
  const [points, setPoints] = useState(0);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [baitStock, setBaitStock] = useState<Record<string, { quantity: number; selected: number }>>({});
  const [filter, setFilter] = useState<GearKind>("rod");
  const [showAngler, setShowAngler] = useState(false);
  const [baitQuantity, setBaitQuantity] = useState(1);
  const { width } = useWindowDimensions();

  const load = useCallback(async () => {
    const [wallet, items, baits] = await Promise.all([getWalkPoints(), getInventory(), getBaitInventory()]);
    setPoints(wallet);
    setInventory(items);
    setBaitStock(Object.fromEntries(baits.map((bait) => [bait.item_id, bait])));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const owned = useMemo(() => new Map(inventory.map((row) => [row.item_id, row])), [inventory]);
  const equipped = SHOP.filter((item) => owned.get(item.id)?.equipped === 1);
  const selectedBait = SHOP.find((item) => baitStock[item.id]?.selected === 1);
  const equippedOutfit = [1, 2, 3, 4].find((stage) =>
    APPAREL_KINDS.every((kind) => owned.get(`${kind}${stage}`)?.equipped === 1),
  );
  const outfitStage = Math.max(0, (equippedOutfit ?? 1) - 1);

  const act = async (id: string) => {
    const item = SHOP.find((entry) => entry.id === id);
    if (!item) return;
    const isApparel = APPAREL_KINDS.includes(item.kind);
    if (item.consumable) {
      const totalCost = item.cost * baitQuantity;
      const ok = await buyBait(item.id, item.cost, baitQuantity);
      if (!ok) Alert.alert("歩数ポイントが不足しています", `あと${Math.max(0, totalCost - points)}pt必要です。`);
      else Alert.alert("餌を購入しました", `${item.name}を${baitQuantity}個購入しました。`);
      await load();
      return;
    }
    if (owned.has(id)) {
      if (isApparel) return;
      await equipItem(id, item.kind);
      await load();
      return;
    }
    const result = await buyItem(id, item.cost);
    if (result === "insufficient") {
      Alert.alert("歩数ポイントが不足しています", `あと${Math.max(0, item.cost - points).toLocaleString()}pt必要です。`);
      return;
    }
    if (result === "ok") {
      if (isApparel) {
        Alert.alert("衣装パーツを交換しました", "帽子・服・ズボン・靴の同じシリーズが揃うと、一式で衣装交換できます。");
      } else {
        await equipItem(id, item.kind);
        Alert.alert("交換しました", `${item.name}を装備しました。`);
      }
    }
    await load();
  };

  return (
    <Screen>
      <Header title="Gear Exchange" sub={`歩数ポイント ${points.toLocaleString()}pt（100歩＝1pt）`} />
      <Card>
        <Text style={ui.h2}>現在の衣装</Text>
        <Pressable onPress={() => setShowAngler(true)} style={styles.anglerPreview}>
          <AnglerArt stage={outfitStage} height={245} />
          <View style={styles.zoomBadge}><Text style={styles.zoomText}>タップして拡大</Text></View>
        </Pressable>
        <Text style={styles.outfitName}>{equippedOutfit ? OUTFIT_NAMES[equippedOutfit - 1] : "普段着"}</Text>
        <Text style={ui.body}>同じシリーズの帽子・服・ズボン・靴を4点揃えると、一式で衣装交換できます。</Text>
        <View style={styles.outfitSets}>
          {[1, 2, 3, 4].map((stage) => {
            const complete = APPAREL_KINDS.every((kind) => owned.has(`${kind}${stage}`));
            const active = equippedOutfit === stage;
            return (
              <View key={stage} style={[styles.outfitSet, active && styles.activeOutfitSet]}>
                <Text style={styles.outfitSetName}>{OUTFIT_NAMES[stage - 1]}</Text>
                <Text style={complete ? styles.complete : styles.incomplete}>{complete ? "4点所持" : "未完成"}</Text>
                <Button
                  title={active ? "着用中" : "一式に着替える"}
                  disabled={!complete || active}
                  kind="secondary"
                  onPress={async () => { await equipOutfitSet(stage); await load(); }}
                />
              </View>
            );
          })}
        </View>
        {equippedOutfit && <Button title="普段着に戻す" kind="secondary" onPress={async () => { await unequipOutfit(); await load(); }} />}
        <View style={styles.loadout}>
          {KINDS.map((kind) => {
            const gear = kind === "bait" ? selectedBait : equipped.find((entry) => entry.kind === kind);
            return (
              <Pressable key={kind} onPress={() => setFilter(kind)} style={[styles.slot, filter === kind && styles.activeSlot]}>
                <Text style={styles.slotEmoji}>{gear?.emoji ?? DEFAULT_ICONS[kind]}</Text>
                <Text style={styles.slotKind}>{KIND_NAMES[kind]}</Text>
                <Text numberOfLines={1} style={styles.slotName}>{gear?.name ?? DEFAULT_GEAR[kind]}</Text>
              </Pressable>
            );
          })}
        </View>
        {filter !== "bait" && !APPAREL_KINDS.includes(filter) && equipped.some((item) => item.kind === filter) && (
          <Button title={`${KIND_NAMES[filter]}を初期装備に戻す`} kind="secondary" onPress={async () => { await unequipKind(filter); await load(); }} />
        )}
      </Card>

      <View style={styles.filters}>
        {KINDS.map((kind) => (
          <Pressable key={kind} onPress={() => setFilter(kind)} style={[styles.filter, filter === kind && styles.activeFilter]}>
            <Text style={[styles.filterText, filter === kind && styles.activeFilterText]}>{KIND_NAMES[kind]}</Text>
          </Pressable>
        ))}
      </View>

      {SHOP.filter((item) => item.kind === filter).map((item) => {
        const row = owned.get(item.id);
        const bait = baitStock[item.id];
        return (
          <Card key={item.id}>
            <View style={styles.item}>
              <GearArt itemId={item.id} size={76} />
              <View style={styles.info}>
                <View style={ui.between}>
                  <Text style={ui.h2}>{item.name}</Text>
                  {row && <Text style={styles.owned}>所持</Text>}
                </View>
                <Text style={ui.body}>{item.description}</Text>
                <Text style={styles.cost}>{item.cost.toLocaleString()} pt</Text>
                {item.consumable && <Text style={styles.stock}>所持 {bait?.quantity ?? 0}個</Text>}
              </View>
            </View>
            {item.consumable ? (
              <View style={styles.baitPurchase}>
                <View style={styles.quantityRow}>
                  <Pressable disabled={baitQuantity <= 1} onPress={() => setBaitQuantity((value) => Math.max(1, value - 1))} style={[styles.quantityButton, baitQuantity <= 1 && styles.quantityDisabled]}>
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>
                  <View style={styles.quantityValue}>
                    <Text style={styles.quantityNumber}>{baitQuantity}</Text>
                    <Text style={styles.quantityUnit}>個（最大10個）</Text>
                  </View>
                  <Pressable disabled={baitQuantity >= 10} onPress={() => setBaitQuantity((value) => Math.min(10, value + 1))} style={[styles.quantityButton, baitQuantity >= 10 && styles.quantityDisabled]}>
                    <Text style={styles.quantityButtonText}>＋</Text>
                  </Pressable>
                </View>
                <Button title={`${baitQuantity}個購入・合計 ${(item.cost * baitQuantity).toLocaleString()}pt`} onPress={() => act(item.id)} />
                <View style={styles.baitActions}>
                {(bait?.quantity ?? 0) > 0 && (
                  <View style={styles.baitAction}>
                    <Button
                      title={bait?.selected === 1 ? "選択中" : "この餌を使う"}
                      disabled={bait?.selected === 1}
                      kind="secondary"
                      onPress={async () => { await selectBait(item.id); await load(); }}
                    />
                  </View>
                )}
                </View>
              </View>
            ) : (
              <Button
                title={APPAREL_KINDS.includes(item.kind) ? (row ? "所持済み" : "衣装パーツを交換") : row?.equipped === 1 ? "装備中" : row ? "装備する" : "交換して装備"}
                onPress={() => act(item.id)}
                disabled={APPAREL_KINDS.includes(item.kind) ? Boolean(row) : row?.equipped === 1}
                kind={row ? "secondary" : "primary"}
              />
            )}
          </Card>
        );
      })}
      <Modal visible={showAngler} transparent animationType="fade" onRequestClose={() => setShowAngler(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAngler(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={ui.h2}>{equippedOutfit ? OUTFIT_NAMES[equippedOutfit - 1] : "普段着"}</Text>
            <AnglerArt stage={outfitStage} height={Math.min(480, width * 1.05)} />
            <Button title="閉じる" onPress={() => setShowAngler(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadout: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginVertical: 12 },
  slot: { width: "23.3%", backgroundColor: colors.foam, borderRadius: 12, padding: 7, alignItems: "center", borderWidth: 1, borderColor: "transparent" },
  activeSlot: { borderColor: colors.coral },
  slotEmoji: { fontSize: 23 },
  slotKind: { fontSize: 9, color: colors.muted },
  slotName: { fontSize: 9, fontWeight: "800", color: colors.ink, maxWidth: "100%" },
  filters: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  filter: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 99, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  activeFilter: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  filterText: { fontSize: 12, fontWeight: "800", color: colors.ink },
  activeFilterText: { color: colors.white },
  item: { flexDirection: "row", gap: 14, marginBottom: 12 },
  info: { flex: 1 },
  cost: { fontWeight: "900", color: colors.coral, marginTop: 5 },
  owned: { color: colors.ocean, backgroundColor: colors.foam, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: "900" },
  anglerPreview: { alignSelf: "stretch", alignItems: "center", marginVertical: 10, borderRadius: 18, backgroundColor: colors.foam, overflow: "hidden" },
  zoomBadge: { position: "absolute", right: 9, bottom: 9, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(6,59,76,.86)" },
  zoomText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  outfitName: { textAlign: "center", fontSize: 17, fontWeight: "900", color: colors.navy, marginBottom: 6 },
  outfitSets: { gap: 8, marginVertical: 12 },
  outfitSet: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 10, gap: 5 },
  activeOutfitSet: { borderColor: colors.coral, backgroundColor: "#FFF6F2" },
  outfitSetName: { fontWeight: "900", color: colors.ink },
  complete: { color: colors.ocean, fontSize: 12, fontWeight: "800" },
  incomplete: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(2,23,31,.78)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 430, backgroundColor: colors.white, borderRadius: 24, padding: 18, alignItems: "center", gap: 12 },
  stock: { color: colors.ocean, fontWeight: "900", marginTop: 4 },
  baitActions: { flexDirection: "row", gap: 8 },
  baitAction: { flex: 1 },
  baitPurchase: { gap: 9 },
  quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  quantityButton: { width: 44, height: 40, borderRadius: 13, backgroundColor: colors.foam, borderWidth: 1, borderColor: colors.aqua, alignItems: "center", justifyContent: "center" },
  quantityDisabled: { opacity: .35 },
  quantityButtonText: { fontSize: 23, fontWeight: "900", color: colors.navy },
  quantityValue: { minWidth: 105, alignItems: "center" },
  quantityNumber: { fontSize: 22, fontWeight: "900", color: colors.navy },
  quantityUnit: { fontSize: 10, color: colors.muted },
});
