# Web年賀状

ブラウザだけで年賀状をデザインし、その場でプレビュー・共有できるシングルページアプリです。PC / スマートフォンのどちらでも、宛名面と挨拶面をリアルタイムに編集しながら確認できます。

## 公開URL / セットアップと起動
- **Web版（推奨）**：ブラウザで `https://koki-doi.github.io/WebNenga` を開くだけで利用できます。
- **ローカル開発**：
  1. `git clone <repo-url>`  
  2. `cd nenga`  
  3. 任意の静的サーバーで `index.html` を配信します（例：`npx serve .` もしくは `python -m http.server 3000`）。共有URLの生成は http(s) 配信環境で行うことを推奨します。
- 依存ライブラリはすべて CDN から読み込み、ビルド工程なしで動作します（ES Modules 構成）。

## 主な仕様と機能
- **リアルタイム編集と共有リンク**：宛名・敬称・差出人・挨拶文・テンプレート・表示オプションを入力すると即時にカードへ反映し、短い共有URLを自動生成します。
- **3Dカード表現**：初期ドロップ演出、パララックス傾き、光沢シェーダ、クリック/Enter/Space/スワイプで裏表反転。ジャイロ許可時は端末の向きでも反映。
- **背景画像アップロード**：サンプル背景をワンクリック適用。任意画像を Cropper.js で 100:148 にトリミングし、即時プレビュー＋Supabase Storage へ WebP で非同期アップロードして公開URLへ差し替え。HEIF→JPEG 変換と EXIF 向き補正に対応。
- **レイアウト自動調整**：挨拶文は message-autofit-lite で「PC で意図した改行位置」をスマホでも維持するようフォントサイズを自動スケール。画像・挨拶文の縦位置を ±300px で微調整でき、localStorage に保存。
- **CSV一括URL生成**：宛名リストを CSV から読み込み、行ごとに共有URLを列Gへ追記した CSV をダウンロード。敬称コード・表示オプションも指定可能。
- **アクセシビリティ / 入力補助**：キーボード操作、タップ/スワイプ、トースト通知、敬称セレクター、挨拶文テンプレート、「謹賀新年」画像や挨拶文背景の ON/OFF などを備えています。

## 技術スタック
- **フロントエンド**：プレーン HTML/CSS/Vanilla JS (ES Modules)。CSS 3D Transform とカスタムプロパティでカード演出。
- **ライブラリ**：Cropper.js（トリミング）、@supabase/supabase-js@2（Storage クライアント）、heic2any（HEIF→JPEG 変換・必要時に動的ロード）、Google Fonts (Noto Sans JP)。
- **ホスティング**：GitHub Pages で静的配信。Analytics に gtag.js を使用。
- **ストレージ/バックエンド**：Supabase Storage を直接フロントから利用（匿名キー使用、画像のみを保存）。
- **ビルド/ツール**：ビルドレス。ローカルは任意の静的サーバーで動作。

## 実装概要
### UIとカード表現
- `js/main.js`：カード表示とエディタの初期化エントリ。
- `js/card-controls.js`：裏表反転（クリック/Enter/Space/スワイプ）、スクロール抑止、ARIA 更新。
- `js/card-effects.js`：パララックス傾き・光沢・ドロップ演出・ジャイロ入力（許可時）。
- `js/message-autofit-lite.js`：挨拶文の自動フィット（基準計測→幅変化に比例スケール）。
- `js/position-controls.js`：画像/挨拶文の縦位置調整（localStorage 永続）。

### データと共有URL
- `js/editor.js`：フォーム入力の反映、プレビュー更新、共有URL生成、背景アップロード、CSVモード切替。
- `js/utils.js`：サニタイズ、ハッシュ短縮 `hashIdShort`、Base64URL エンコード/デコード `encodeData`/`decodeData`、`parseHash` など。
- 共有URLは `#id=<短ID>&data=<Base64URL>` を location.hash に書き込み、受信側は hash を解析してカード状態を復元します。短IDは宛名+差出人から SHA-256 を計算し Base64URL で短縮。
- `js/csv-mode.js`：CSV をパースし、各行に共有URLを付与して再出力。ヘッダーなしで A:宛名/B:敬称コード/C:差出人/D:挨拶文/E:謹賀新年(0/1)/F:挨拶文背景(0/1)、出力は列G。

### 画像処理
- `js/image-utils.js`：HEIF 判定と heic2any で JPEG 変換、createImageBitmap で EXIF 向きを補正、最大辺スケール縮小＋ WebP/JPEG で 2MB 未満に圧縮、Cropper.js からの Canvas をエンコード。
- トリミング後は Blob URL を即時プレビューに適用し、バックグラウンドで公開URL取得を試行。接続不可なら dataURL を共有データへ直埋め込み（詳細は Supabase 仕様を参照）。

## Supabase Storage 仕様
- **用途**：背景画像の公開URLを発行するため常時利用します（接続不可時のみ dataURL 埋め込みに自動フォールバック）。
- **設定ファイル**：`js/storage.js` に `SUPABASE_URL` と `SUPABASE_ANON_KEY` を記載。デフォルトは `mabggyxwheluuopysqhi.supabase.co` のサンプル値なので、自前プロジェクトでは差し替えてください。
- **バケット**：`nenga`（Public 推奨）。画像のみ保存。
- **アップロード仕様**：`uploadBgWebP(dataUrl, shortId)` で dataURL→Blob に変換し、`bg/<shortId>-<timestamp>-<rand>.webp` というユニークキーで `upsert: false` で保存。`contentType: image/webp`、`cacheControl: 31536000, immutable`。保存後に `getPublicUrl` で公開URLを取得し、プレビューと共有データに反映。
- **フォールバック**：アップロード失敗時は `remoteUploadDisabled` フラグを立て、dataURL を共有データに直接埋め込み、トーストで通知（`editor.js` 内 `applyLocalOnlyBackground`）。
- **運用上の注意**：プロジェクトが *Paused* になると API が停止するため、ダッシュボードで Resume するか Pro プランへ移行してください。匿名キーをフロントに持たせる構成のため、不要なバケット/権限を持たない最小構成にすることを推奨します。

## 使い方
### 基本操作
1. 左下の「編集」を押してエディタを開く。
2. 宛名・敬称・差出人・挨拶文を入力（またはテンプレート選択）すると即座にカードへ反映、共有URL欄も自動更新。
3. 「謹賀新年」画像の表示や挨拶文背景（白半透明）はチェックボックスで切替。
4. 右下の「URLをコピー」で共有リンクをクリップボードへコピー。
5. カードの裏表はクリック / Enter / Space / 左右スワイプで切替。光沢はポインター位置や端末傾きに追従。

### 背景画像アップロード
1. 「背景」でサンプルを選ぶと即適用・共有URLも更新。  
2. 任意画像を選び、Cropper.js の 100:148 枠で位置・拡大率を調整し「トリミング適用」。初回は自動で1回適用。  
3. トリミング後、Blob URL が即座にプレビューへ適用され、並行して Supabase Storage へ WebP アップロード→公開URLへ差し替え。接続不可時は dataURL 埋め込みに自動フォールバック。  
4. HEIF/HEIC は自動で JPEG に変換し、iOS の向きも補正。最大サイズは自動圧縮で概ね 2MB 未満。  
5. 「画像を書き出し」で現在の背景を `nenga_bg.webp` としてダウンロード可能。

### CSV一括URL生成
1. 「CSVモード」を押し、A〜F 列を備えた CSV（ヘッダーなし）を選択。  
2. 「URL生成してCSVダウンロード」で各行の共有URLを列Gに追記した CSV を保存。背景画像URLは現在の安定URLを共有データに使用。  
   - A: 宛名（必須）  
   - B: 敬称コード（0:様 / 1:殿 / 2:君 / 3:御中 / 4:なし）  
   - C: 差出人（必須）  
   - D: 挨拶文（任意）  
   - E: 「謹賀新年」表示（0/1）  
   - F: 挨拶文背景（0:無し / 1:白半透明）

### 共有URLの仕組み
- URLフラグメント `#id=<短ID>&data=<Base64URL>` にカード状態を格納（宛名・差出人・挨拶文・背景URL・表示オプション・テンプレートIDなど）。
- 受け取った側は同じ URL を開くだけで状態を復元。外部背景 URL が無効な場合のみ表示が変わる可能性があります。

## ディレクトリ構成
```
├─ index.html                 # 3Dカード本体とエディタUI
├─ nenga.css                  # レイアウト・アニメーション・3D表現
├─ images/                    # サンプル背景・切手・プレースホルダー・装飾画像
└─ js/
   ├─ main.js                 # 初期化エントリ
   ├─ card-controls.js        # 裏表反転・キー/スワイプ・スクロール抑止
   ├─ card-effects.js         # パララックス・光沢・ドロップ・ジャイロ制御
   ├─ editor.js               # 編集モーダル、背景アップロード、URL生成、CSVモード
   ├─ csv-mode.js             # CSV読み込みと一括URL生成
   ├─ image-utils.js          # HEIF変換、EXIF補正、圧縮、トリミング補助
   ├─ storage.js              # Supabase Storage アップロード処理
   ├─ message-autofit-lite.js # 挨拶文の自動フィット（軽量版）
   ├─ message-autofit.js      # 挨拶文フィットの詳細版（参考実装）
   ├─ position-controls.js    # 画像・挨拶文の縦位置調整（localStorage保存）
   ├─ templates.js            # 挨拶文テンプレート定義
   └─ utils.js                # サニタイズ、トースト、ハッシュ生成など共通処理
```

## 開発メモ
- ビルドレス構成。CSS/JS を編集したらブラウザをリロードするだけで反映されます。
- 共有URL生成は debounce で入力をまとめ、短ID は SHA-256 → Base64URL 短縮で生成。
- 背景アップロードは接続不可時に dataURL 埋め込みへ自動フォールバックし、利用者にトーストで通知します。
- 画像・挨拶文の縦位置は range 入力で微調整し、localStorage に保存して再訪時も維持します。

## 使用ライブラリと素材
- [Cropper.js](https://github.com/fengyuanchen/cropperjs)（トリミング）
- [@supabase/supabase-js](https://github.com/supabase/supabase-js)（Storage クライアント）
- [heic2any](https://github.com/alexcorvi/heic2any)（HEIF → JPEG 変換・必要時に動的ロード）
- フォント: Google Fonts "Noto Sans JP"
- 画像素材や挨拶文テンプレートを差し替える際は、権利・利用規約を必ずご確認ください。

Happy New Year 🎍
