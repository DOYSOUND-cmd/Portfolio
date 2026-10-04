# DOYSOUND — Portfolio

CAE解析エンジニアとしての業務と、個人での楽器制作・電子工作・Webフロント開発の成果をまとめたポートフォリオサイト。
2019年〜2026年の15作品を、それぞれ独立した詳細ページで公開している。

**公開URL:** https://doysound-cmd.github.io/Portfolio/

## 技術構成

ビルドツール・パッケージマネージャ・フレームワークを使わない、素の HTML / CSS / JavaScript で構成している。
`git clone` してブラウザで `index.html` を開けばそのまま動く。

| 項目 | 採用技術 |
|---|---|
| マークアップ | HTML（ページ単位の静的ファイル） |
| スタイル | CSS カスタムプロパティによるデザイントークン、ダーク／ライトテーマ対応 |
| スクリプト | ES Modules（バンドルなし） |
| 3Dビューア | Three.js r147（CDN）— glTF / STL |
| 3DGSビューア | Spark（`assets/ldk-viewer.html` に自己完結） |
| ホスティング | GitHub Pages |

### ローカルでの確認

ES Modules を使っているため `file://` では動かない。任意の静的サーバを立てる。

```bash
python -m http.server 8000
```

## ディレクトリ構成

```
├── index.html              トップ（プロフィールカード / カルーセル / 資格）
├── productions.html        作品一覧（検索・タグ絞り込み）
├── 404.html
├── projects/               作品詳細ページ 15 件
├── scripts/
│   ├── projects-data.js    ★ 作品データの単一ソース
│   ├── project-card.js     カード生成（カルーセルと一覧で共有）
│   ├── project-carousel.js トップの無限ループカルーセル
│   ├── project-listing.js  一覧の生成・検索・タグ絞り込み
│   ├── project-detail.js   詳細ページの画像調整
│   ├── project-3d-viewer.js  Three.js ビューア（glTF / STL）
│   ├── project-embed-viewer.js  iframe デモの遅延起動
│   ├── profile-card.js     名刺カードの反転・傾き・文字サイズ調整
│   ├── site-chrome.js      共通ヘッダ / フッタ / 前後ナビの注入
│   ├── site-core.js        スムーススクロール / アコーディオン等
│   ├── site-theatre.js     背景演出・リビール・ライトボックス
│   └── theme-init.js       初回描画前のテーマ確定（FOUC防止）
├── styles/                 スクリプトと対になる CSS
└── assets/                 画像・3Dモデル・埋め込みデモ
```

## 設計上の決めごと

- **作品データは `scripts/projects-data.js` の `PROJECTS` 配列が単一ソース。**
  カルーセル・一覧・詳細ページ下部の前後ナビはすべてここから生成される。
  作品を追加するときはこの配列に足し、`projects/` に詳細ページを置く。
  トップのカルーセルに出す作品は `HOME_FEATURED_IDS` で選ぶ。

- **共通の枠（ヘッダ・フッタ・前後ナビ）は `site-chrome.js` が実行時に注入する。**
  各 HTML には書かない。ナビを変えるならこのファイル1箇所。

- **`theme-init.js` は `<head>` で同期読み込みする。**
  描画後だとテーマが一瞬ちらつくため、`defer` や `module` にしてはいけない。

- **CSS と JS はファイル名で対応づけている**（`site-theatre.js` ↔ `site-theatre.css`）。

- **演出は必ず `prefers-reduced-motion` を尊重する。**
  また `site-theatre.js` の各ステップは個別に try/catch で隔離してあり、
  1つが失敗しても他の演出とコンテンツ表示は生き残る。

## ライセンス

未設定。`assets/` 配下の画像・3Dモデル・作品写真は著作権を保持している。
コード部分を再利用可能にする場合は、別途 `LICENSE` を追加すること。
