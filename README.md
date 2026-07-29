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

- 現在地を基準に固定される池・川・湖・海の4釣り場、300m圏内判定、歩数による場所解放
- 端末のモーション／歩数データによる今日・暦月の日別グラフ、合計・平均・最高記録
- キャスト、ヒット、3秒以内の引き上げ、成功／逃走を備えた釣りゲーム
- 歩数と7種類の装備効果、選択した釣り場が魚・レア率・サイズ・報酬へ反映
- E〜SSSの全8ランク、魚・水辺の生き物32種、複数水族館別の図鑑
- 帽子、服、ズボン、靴、竿、餌、クーラーの購入・交換・装備スロット
- 釣果、場所、釣った時の歩数、自己ベスト、コイン、装備、日別歩数をSQLiteへ保存
- 専用イラスト: 魚・生き物32種、装備16種、4釣り場、水族館、4段階アングラー衣装

> 位置情報・歩数・釣果は外部サーバーへ送信しません。Google/Apple標準地図のタイル表示はOS側の通信を使用します。

ゲーム用イラストは `assets/game/` に格納し、図鑑・釣り・交換画面でスプライト表示します。すべてFishing Walk向けに生成したオリジナル素材です。

## 開発

```powershell
npm install
npm run typecheck
npm run lint
npx expo start -c
```

## Google Maps APIキー

バックエンドは不要です。あじさい物流と全く同じGoogle Maps APIキーを使用します。キーは `config/google-maps-key.txt` に直接保存し、ローカルとGitHub Actionsの両方で読み取ります。

別のPCでは `.env.local` に同じキーを設定できます。

```dotenv
GOOGLE_MAPS_API_KEY=あじさい物流と同じAPIキー
```

GitHub Actionsの `GOOGLE_MAPS_API_KEY` Secretは不要です。Google Cloud側ではこのキーで `Maps SDK for Android` も有効にしてください。既存キーにWebサイト制限が設定されている場合、Android SDKから拒否される可能性があります。

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
