# Fishing Walk

位置情報・歩数・釣りを組み合わせた、サーバー不要のローカル完結型モバイルアプリです。

| 項目 | 内容 |
|---|---|
| アプリ名 | Fishing Walk |
| バージョン | 0.1.0 |
| Framework | Expo SDK 57 / React Native 0.86 |
| Language | TypeScript |
| 画面向き | 縦画面固定 |
| 保存 | SQLite、アプリ専用領域 |
| 通信 | 通常利用では不要（地図タイル取得を除く） |
| Android | Release APK |
| iOS | EAS / TestFlight設定のみ、実機未検証 |

## 機能

- 現在地と4種類の釣り場を表示するマップ
- 端末のモーション／歩数データによる今日・月間グラフ
- 歩数と装備がレア率へ反映される釣りゲーム
- E〜SSSランクの魚・生き物、水族館別図鑑
- 帽子、服、ズボン、靴、竿、餌、クーラーの交換・装備
- 釣果、自己ベスト、コイン、装備、日別歩数をSQLiteへ保存

> 位置情報・歩数・釣果は外部サーバーへ送信しません。Google/Apple標準地図のタイル表示はOS側の通信を使用します。

## 開発

```powershell
npm install
npm run typecheck
npm run lint
npx expo start -c
```

## Google Maps APIキー

バックエンドは不要です。あじさい物流と全く同じGoogle Maps APIキーを使用します。このPCでのローカルビルドでは、`../ajisaiLogistics/frontend/ajisai_logistics/assets/js/map-config.js` の設定値を自動的に読み取ります。キーそのものはFishing WalkのGit履歴へ複製しません。

別のPCでは `.env.local` に同じキーを設定できます。

```dotenv
GOOGLE_MAPS_API_KEY=あじさい物流と同じAPIキー
```

GitHub ActionsではRepository secret `GOOGLE_MAPS_API_KEY` に、あじさい物流と同じ値を登録します。APIキーはリポジトリへコミットしません。

Google Cloud側ではこのキーで `Maps SDK for Android` も有効にしてください。既存キーにWebサイト制限が設定されている場合、Android SDKから拒否される可能性があります。その場合だけキー制限の変更が必要です。

## ブランチとAPK

| ブランチ | 用途 | APK |
|---|---|---|
| `main` | 開発 | 自動生成なし |
| `stg` | STG | `fishing-walk-stg.apk` |
| `production` | PRD | `fishing-walk-prd.apk` |

`stg` / `production`へのpushでGitHub ActionsがRelease APKを作成し、Artifactと指定Google Driveフォルダへアップロードします。Repository secret `GDRIVE_RCLONE_CONFIG_BASE64` に、remote名が `gdrive` のrclone設定をBase64で登録してください。

## 注意

- Android/iOSの歩数取得はモーション権限が必要です。
- iOSビルド・TestFlightにはApple Developer設定とEAS project IDの設定が必要です。
- APKの継続アップデートには固定した署名鍵を安全に管理してください。
