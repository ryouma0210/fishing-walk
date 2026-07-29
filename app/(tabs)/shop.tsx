import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button, Card, Header, Screen, ui } from "../../src/components/ui";
import { AnglerArt, GearArt } from "../../src/components/GameArt";
import { DEFAULT_GEAR, GearKind, SHOP } from "../../src/constants/game";
import { buyItem, equipItem, getCoins, getInventory, InventoryRow, unequipKind } from "../../src/database/db";
import { colors } from "../../src/constants/theme";

const KIND_NAMES: Record<GearKind, string> = {
  hat: "帽子", top: "服", bottom: "ズボン", shoes: "靴", rod: "竿", bait: "餌", cooler: "クーラー",
};
const KINDS = Object.keys(KIND_NAMES) as GearKind[];

export default function ShopScreen() {
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [filter, setFilter] = useState<GearKind>("rod");

  const load = useCallback(async () => {
    const [wallet, items] = await Promise.all([getCoins(), getInventory()]);
    setCoins(wallet);
    setInventory(items);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const owned = useMemo(() => new Map(inventory.map((row) => [row.item_id, row])), [inventory]);
  const equipped = SHOP.filter((item) => owned.get(item.id)?.equipped === 1);
  const outfitStage = equipped.some((item) => item.id === "rod4") ? 3
    : equipped.length >= 5 ? 2
      : equipped.length >= 2 ? 1 : 0;

  const act = async (id: string) => {
    const item = SHOP.find((entry) => entry.id === id);
    if (!item) return;
    if (owned.has(id)) {
      await equipItem(id, item.kind);
      await load();
      return;
    }
    const result = await buyItem(id, item.cost);
    if (result === "insufficient") {
      Alert.alert("コインが不足しています", `あと${Math.max(0, item.cost - coins).toLocaleString()}コイン必要です。`);
      return;
    }
    if (result === "ok") {
      await equipItem(id, item.kind);
      Alert.alert("交換しました", `${item.name}を装備しました。`);
    }
    await load();
  };

  return (
    <Screen>
      <Header title="Gear Exchange" sub={`所持コイン ${coins.toLocaleString()} 🪙`} />
      <Card>
        <View style={styles.anglerRow}>
          <AnglerArt stage={outfitStage} />
          <View style={styles.anglerCopy}>
            <Text style={ui.h2}>現在の装備</Text>
            <Text style={ui.body}>装備を集めるとアングラーの姿もグレードアップします。</Text>
          </View>
        </View>
        <View style={styles.loadout}>
          {KINDS.map((kind) => {
            const item = equipped.find((entry) => entry.kind === kind);
            return (
              <Pressable key={kind} onPress={() => setFilter(kind)} style={[styles.slot, filter === kind && styles.activeSlot]}>
                <Text style={styles.slotEmoji}>{item?.emoji ?? ({ hat:"◯", top:"👕", bottom:"👖", shoes:"👟", rod:"🎣", bait:"🪱", cooler:"🧊" })[kind]}</Text>
                <Text style={styles.slotKind}>{KIND_NAMES[kind]}</Text>
                <Text numberOfLines={1} style={styles.slotName}>{item?.name ?? DEFAULT_GEAR[kind]}</Text>
              </Pressable>
            );
          })}
        </View>
        {equipped.some((item) => item.kind === filter) && (
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
                <Text style={styles.cost}>{item.cost.toLocaleString()} 🪙</Text>
              </View>
            </View>
            <Button
              title={row?.equipped === 1 ? "装備中" : row ? "装備する" : "交換して装備"}
              onPress={() => act(item.id)}
              disabled={row?.equipped === 1}
              kind={row ? "secondary" : "primary"}
            />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadout: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginVertical: 12 },
  slot: { width: "31.5%", backgroundColor: colors.foam, borderRadius: 12, padding: 8, alignItems: "center", borderWidth: 1, borderColor: "transparent" },
  activeSlot: { borderColor: colors.coral },
  slotEmoji: { fontSize: 25 },
  slotKind: { fontSize: 9, color: colors.muted },
  slotName: { fontSize: 10, fontWeight: "800", color: colors.ink, maxWidth: "100%" },
  filters: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  filter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  activeFilter: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  filterText: { fontSize: 12, fontWeight: "800", color: colors.ink },
  activeFilterText: { color: colors.white },
  item: { flexDirection: "row", gap: 14, marginBottom: 12 },
  info: { flex: 1 },
  cost: { fontWeight: "900", color: colors.coral, marginTop: 5 },
  owned: { color: colors.ocean, backgroundColor: colors.foam, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: "900" },
  anglerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  anglerCopy: { flex: 1, gap: 6 },
});
