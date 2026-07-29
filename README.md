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
- 斜め俯瞰ゲームマップ、現在地の背面アングラー、到達範囲リング、立体釣り場ビーコン
- 端末のモーション／歩数データによる今日・暦月の日別グラフ、合計・平均・最高記録
- キャスト、魚影接近、ウキ沈下、合わせ、ゲージバトル、捕獲演出を備えた釣りゲーム
- ランク別に異なるゲージ範囲・維持時間・魚の引き。長押しリール操作で対象範囲内を維持
- 歩数と8種類の装備効果、選択した釣り場が魚・レア率・サイズへ反映
- E〜SSSの全8ランク、池20・川20・湖20・海20の合計80種、複数水族館別の図鑑
- 帽子、服、ズボン、靴、竿、リール、餌、クーラーを各4種類、合計32種類用意
- リールは対象ゲージと巻き取り操作、竿は維持時間、衣装は魚の速度と最大サイズに反映
- 餌は使用ごとに消費し、狙える魚のランクを指定。クーラーは一日の上限を50・100・500・1000匹へ拡張
- 交換通貨は歩数ポイントのみ（100歩＝1pt）。釣果からポイントは付与しない
- 釣果、場所、釣った時の歩数、自己ベスト、歩数ポイント消費、装備、日別歩数をSQLiteへ保存
- 専用イラスト: 魚・生き物80種、装備32種、4釣り場、水族館、4段階アングラー衣装

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
