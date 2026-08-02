import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { fromByteArray, toByteArray } from "base64-js";
import { Button, Card, Header, Screen, ui } from "../src/components/ui";
import { exportDatabaseBytes, restoreDatabaseBytes } from "../src/database/db";
import { requestHealthAccess, syncHealthMonth } from "../src/services/healthService";
import { AppSettings, DEFAULT_SETTINGS, getSettings, saveSettings } from "../src/services/settingsService";
import { colors } from "../src/constants/theme";

function Choice<T extends string | number>({ value, options, onChange }: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choices}>
      {options.map((option) => (
        <Pressable key={String(option.value)} onPress={() => onChange(option.value)} style={[styles.choice, value === option.value && styles.activeChoice]}>
          <Text style={[styles.choiceText, value === option.value && styles.activeChoiceText]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [healthPermission, setHealthPermission] = useState("確認中");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setSettings(await getSettings());
    const now = new Date();
    const health = await syncHealthMonth(now.getFullYear(), now.getMonth() + 1);
    setHealthPermission(`${health.provider}：${health.permission === "granted" ? "許可済み" : health.permission === "required" ? "権限が必要" : "利用不可"}`);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const update = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  const resync = async () => {
    setBusy(true);
    const now = new Date();
    const result = await syncHealthMonth(now.getFullYear(), now.getMonth() + 1);
    setHealthPermission(`${result.provider}：${result.status}`);
    setBusy(false);
    Alert.alert("歩数再同期", result.status);
  };

  const connectHealth = async () => {
    setBusy(true);
    try {
      const granted = await requestHealthAccess();
      if (!granted) {
        const now = new Date();
        const result = await syncHealthMonth(now.getFullYear(), now.getMonth() + 1);
        setHealthPermission(`${result.provider}：${result.status}`);
        Alert.alert("歩数連携", result.status);
        return;
      }
      await resync();
    } catch {
      Alert.alert("歩数連携", "権限が拒否されてもアプリ内の保存データは利用できます。端末設定から後で許可できます。");
    } finally {
      setBusy(false);
    }
  };

  const openHealthConnect = async () => {
    const url = "market://details?id=com.google.android.apps.healthdata";
    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata");
    }
  };

  const exportData = async () => {
    setBusy(true);
    try {
      const bytes = await exportDatabaseBytes();
      const uri = `${FileSystem.cacheDirectory}fishing-walk-backup-${new Date().toISOString().slice(0, 10)}.fwbackup`;
      await FileSystem.writeAsStringAsync(uri, fromByteArray(bytes), { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/octet-stream", dialogTitle: "Fishing Walkデータを書き出す" });
      else Alert.alert("書き出し完了", uri);
    } catch {
      Alert.alert("書き出し失敗", "バックアップファイルを作成できませんでした。");
    } finally {
      setBusy(false);
    }
  };

  const selectRestore = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    Alert.alert("データを復元", "現在の釣果・歩数・装備を選択したバックアップで置き換えます。よろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "復元する", style: "destructive", onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              const encoded = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
              await restoreDatabaseBytes(toByteArray(encoded));
              Alert.alert("復元完了", "データを復元しました。各画面を開き直すと反映されます。");
            } catch {
              Alert.alert("復元失敗", "Fishing Walkのバックアップファイルを確認してください。");
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <Screen>
        <View style={ui.between}>
          <Header title="設定" sub="端末機能・表示・データ管理" />
          <Pressable onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>閉じる</Text></Pressable>
        </View>
        <Card>
          <Text style={ui.h2}>サウンド・演出</Text>
          <Text style={styles.label}>音量</Text>
          <Choice value={settings.soundVolume} onChange={(soundVolume) => update({ soundVolume })} options={[
            { label: "消音", value: 0 }, { label: "小", value: 0.35 }, { label: "中", value: 0.7 }, { label: "大", value: 1 },
          ]} />
          <View style={styles.switchRow}><Text style={ui.body}>端末振動</Text><Switch value={settings.vibration} onValueChange={(vibration) => update({ vibration })} /></View>
          <Text style={styles.label}>演出速度</Text>
          <Choice value={settings.animationSpeed} onChange={(animationSpeed) => update({ animationSpeed })} options={[
            { label: "ゆっくり", value: 0.75 }, { label: "標準", value: 1 }, { label: "速い", value: 1.35 },
          ]} />
          <Text style={styles.label}>文字サイズ</Text>
          <Choice value={settings.textScale} onChange={(textScale) => update({ textScale })} options={[
            { label: "小", value: 0.9 }, { label: "標準", value: 1 }, { label: "大", value: 1.15 }, { label: "特大", value: 1.3 },
          ]} />
        </Card>

        <Card>
          <Text style={ui.h2}>歩数・権限</Text>
          <View style={styles.permission}><Text style={ui.body}>歩数データ</Text><Text style={styles.permissionValue}>{healthPermission}</Text></View>
          <Button title={busy ? "確認中…" : "権限を確認・連携"} disabled={busy} onPress={connectHealth} />
          <Button title={busy ? "同期中…" : "歩数を再同期"} disabled={busy} onPress={resync} />
          {Platform.OS === "android" && healthPermission.includes("未インストール") && (
            <Button title="Health Connectをインストール" kind="secondary" onPress={openHealthConnect} />
          )}
          <Text style={styles.healthNote}>権限を許可しない場合もアプリは終了せず、端末内に保存済みの歩数を表示します。</Text>
        </Card>

        <Card>
          <Text style={ui.h2}>データ管理</Text>
          <Text style={ui.body}>釣果、歩数、装備、ポイント、水族館設定を端末内のバックアップファイルへ保存・復元します。</Text>
          <Button title={busy ? "処理中…" : "データを書き出す"} disabled={busy} onPress={exportData} />
          <Button title="バックアップから復元" disabled={busy} kind="secondary" onPress={selectRestore} />
        </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  close: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: colors.foam },
  closeText: { color: colors.navy, fontWeight: "900" },
  label: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 12, marginBottom: 6 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  activeChoice: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  choiceText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  activeChoiceText: { color: colors.white },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  permission: { gap: 3, marginVertical: 13, padding: 10, borderRadius: 12, backgroundColor: colors.foam },
  permissionValue: { color: colors.ocean, fontSize: 11, fontWeight: "800" },
  healthNote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },
});
