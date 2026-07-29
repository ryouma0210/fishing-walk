import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Header, Screen, ui } from "../../src/components/ui";
import { AquariumHero, FishArt } from "../../src/components/GameArt";
import { FISH, RANKS } from "../../src/constants/game";
import { CatchSummary, getCatchStats, getCatchSummaries } from "../../src/database/db";
import { colors, rankColors } from "../../src/constants/theme";

type Filter = "すべて" | string;

export default function Aquarium() {
  const [rows, setRows] = useState<CatchSummary[]>([]);
  const [stats, setStats] = useState({ count: 0, unique_count: 0, largest: 0 });
  const [filter, setFilter] = useState<Filter>("すべて");
  const [showLocked, setShowLocked] = useState(true);

  useFocusEffect(useCallback(() => {
    Promise.all([getCatchSummaries(), getCatchStats()]).then(([summaries, totals]) => {
      setRows(summaries);
      setStats(totals);
    });
  }, []));

  const aquariums = useMemo(() => [...new Set(FISH.map((fish) => fish.aquarium))], []);
  const visibleAquariums = filter === "すべて" ? aquariums : [filter];

  return (
    <Screen>
      <Header title="My Aquarium" sub={`図鑑 ${rows.length} / ${FISH.length} 種`} />
      <AquariumHero />
      <Card>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={ui.muted}>総釣果</Text><Text style={styles.statValue}>{stats.count}</Text></View>
          <View style={styles.stat}><Text style={ui.muted}>発見率</Text><Text style={styles.statValue}>{Math.round(rows.length / FISH.length * 100)}%</Text></View>
          <View style={styles.stat}><Text style={ui.muted}>最大</Text><Text style={styles.statValue}>{stats.largest.toLocaleString()}cm</Text></View>
        </View>
        <View style={styles.rankProgress}>
          {RANKS.map((rank) => {
            const total = FISH.filter((fish) => fish.rank === rank).length;
            const found = FISH.filter((fish) => fish.rank === rank && rows.some((row) => row.fish_id === fish.id)).length;
            return (
              <View key={rank} style={[styles.rankDot, { backgroundColor: rankColors[rank], opacity: found === total ? 1 : 0.35 }]}>
                <Text style={styles.rankText}>{rank}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.filters}>
        {["すべて", ...aquariums].map((name) => (
          <Pressable key={name} onPress={() => setFilter(name)} style={[styles.filter, filter === name && styles.activeFilter]}>
            <Text style={[styles.filterText, filter === name && styles.activeFilterText]}>{name}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setShowLocked((value) => !value)}>
        <Text style={styles.lockToggle}>{showLocked ? "未発見を隠す" : "未発見も表示"}</Text>
      </Pressable>

      {visibleAquariums.map((aquarium) => {
        const master = FISH.filter((fish) => fish.aquarium === aquarium);
        const found = rows.filter((row) => row.aquarium === aquarium);
        const display = showLocked ? master : master.filter((fish) => rows.some((row) => row.fish_id === fish.id));
        if (!display.length) return null;
        return (
          <Card key={aquarium}>
            <View style={ui.between}>
              <Text style={ui.h2}>{aquarium}</Text>
              <Text style={ui.muted}>{found.length}/{master.length}</Text>
            </View>
            <View style={styles.grid}>
              {display.map((fish) => {
                const caught = rows.find((row) => row.fish_id === fish.id);
                return (
                  <View key={fish.id} style={[styles.fishCard, !caught && styles.locked]}>
                    <FishArt fishId={fish.id} size={74} locked={!caught} />
                    <Text style={styles.fishName}>{caught ? fish.name : "未発見"}</Text>
                    <Text style={[styles.rank, { color: caught ? rankColors[fish.rank] : colors.muted }]}>{fish.rank} RANK</Text>
                    {caught
                      ? <><Text style={styles.record}>🏆 {caught.max_size.toLocaleString()}cm</Text><Text style={ui.muted}>{caught.count}匹</Text></>
                      : <Text style={ui.muted}>{fish.habitats.map((habitat) => ({ pond:"池", river:"川", lake:"湖", sea:"海" })[habitat]).join("・")}</Text>}
                    <Text numberOfLines={2} style={styles.description}>{caught ? fish.description : "釣り上げると詳細が解放されます"}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center", backgroundColor: colors.foam, padding: 9, borderRadius: 12 },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.navy },
  rankProgress: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  rankDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  rankText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  filters: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  filter: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  activeFilter: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  filterText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  activeFilterText: { color: colors.white },
  lockToggle: { color: colors.ocean, fontWeight: "800", textAlign: "right" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  fishCard: { width: "48%", backgroundColor: colors.foam, borderRadius: 14, padding: 12, alignItems: "center" },
  locked: { opacity: 0.48 },
  fishName: { fontWeight: "900", color: colors.ink, marginTop: 4, textAlign: "center" },
  rank: { fontSize: 11, fontWeight: "900", marginTop: 2 },
  record: { fontSize: 12, fontWeight: "800", color: colors.coral, marginTop: 3 },
  description: { fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 5, lineHeight: 14 },
});
