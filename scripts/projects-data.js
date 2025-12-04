// Single source of project/icon data
const ICON_BASE = "./assets/icons/";

export const ICON_MAP = {
  Linux: ICON_BASE + "Linux.png",
  JavaScript: ICON_BASE + "JS.png",
  CSS: ICON_BASE + "CSS.png",
  HTML: ICON_BASE + "HTML.png",
  CAD: ICON_BASE + "CAD.jpg",
  CAE: ICON_BASE + "CAE.png",
  "electronic circuit": ICON_BASE + "electronic_circuit.jpg",
  "Three.js": ICON_BASE + "Threejs.png",
  FPGA: ICON_BASE + "fpga.png",
  PYNQ: ICON_BASE + "PYNQ.png",
  Python: ICON_BASE + "Python.png",
  HDL: ICON_BASE + "HDL.png",
  "C++": ICON_BASE + "Cpurapura.png",
  Processing: ICON_BASE + "Processing.png"
};

// Projects shown in carousel/list (ordered newest -> old)
export const PROJECTS = [
  // 2025
  {
    id: "fpga-fx",
    title: "FPGAギターエフェクター",
    desc: "リアルタイム処理が得意なFPGAでオーディオエフェクトを実現（開発中）",
    img: "./assets/work_fpga_fx.png",
    tags: ["FPGA", "PYNQ", "Linux", "HDL", "Python", "C++"],
    links: [{ label: "詳細", href: "./projects/fpga-guitar-fx.html" }],
    year: 2025
  },
  {
    id: "web-nenga",
    title: "Web年賀状",
    desc: "ブラウザ上で表示できる年賀状",
    img: "./assets/work_web_nenga.png",
    tags: ["HTML", "CSS", "JavaScript"],
    links: [{ label: "詳細", href: "./projects/web-new-year-card.html" }],
    year: 2025
  },
  {
    id: "web-cae",
    title: "Web CAEアプリ",
    desc: "NASA Space Apps Challenge 2025提出作品のWeb CAEアプリ",
    img: "./assets/work_web_cae.png",
    tags: ["CAE", "Python", "HTML", "CSS", "JavaScript", "Three.js"],
    links: [{ label: "詳細", href: "./projects/web-cae-app.html" }],
    year: 2025
  },
  {
    id: "retro-lumen",
    title: "Retro Lumen",
    desc: "ブラウン管風シェーダと画面キャプチャを組み合わせたレトロ表示Webアプリ",
    img: "./assets/RetroLumen_0.png",
    tags: ["HTML", "CSS", "JavaScript", "Three.js"],
    links: [{ label: "詳細", href: "./projects/retro-lumen.html" }],
    year: 2025
  },

    { id:"nameplate", 
      title:"リアルVRネームプレート",
      desc:"VR空間のネームプレートを現実世界で再現",
      img:"./assets/nameplate.png", 
      tags:["CAE","HTML","CSS","JavaScript","Three.js"], 
      links:[{label:"詳細",href:"./projects/vr-nameplate.html"}] ,
      year:2025
  },

  // 2024
  {
    id: "strat",
    title: "ストラトキャスタータイプギター",
    desc: "桐材を使用したストラトキャスタータイプギター",
    img: "./assets/work_strat.jpg",
    tags: ["CAD", "electronic circuit"],
    links: [{ label: "詳細", href: "./projects/stratocaster-build.html" }],
    year: 2024
  },
  {
    id: "tube-booster",
    title: "真空管クリーンブースター",
    desc: "真空管を用いたアナログギターエフェクター",
    img: "./assets/work_tube_booster.jpg",
    tags: ["electronic circuit"],
    links: [{ label: "詳細", href: "./projects/tube-clean-booster.html" }],
    year: 2024
  },
  {
    id: "megaphone-v2",
    title: "ライブ用メガホン Ver.2",
    desc: "ESP32でデジタル音声処理するライブ用メガホン",
    img: "./assets/VocalEffector_exterior.jpg",
    tags: ["electronic circuit", "C++","HTML", "CSS", "JavaScript"],
    links: [{ label: "詳細", href: "./projects/megaphone_v2.html" }],
    year: 2024
  },

  // 2023
  {
    id: "glove-drum",
    title: "手袋型電子ドラム",
    desc: "指先のピエゾをトリガーにした省スペース電子ドラム",
    img: "./assets/drams1.png",
    tags: ["electronic circuit", "C++"],
    links: [{ label: "詳細", href: "./projects/glove_drum.html" }],
    year: 2023
  },

  // 2022
  {
    id: "jazzmaster",
    title: "ジャズマスタータイプギター",
    desc: "LEDポジションとタッチ式キルスイッチを備えた自作ジャズマスター",
    img: "./assets/JM_1.jpg",
    tags: ["electronic circuit"],
    links: [{ label: "詳細", href: "./projects/jazzmaster.html" }],
    year: 2022
  },
  {
    id: "megaphone-v1",
    title: "ライブ用メガホン Ver.1",
    desc: "ライン出力でミキサーに直結できるアナログ構成のメガホン",
    img: "./assets/megaphoneV1_1.jpg",
    tags: ["electronic circuit"],
    links: [{ label: "詳細", href: "./projects/megaphone_v1.html" }],
    year: 2022
  },

  // 2019
  {
    id: "falcon-guitar",
    title: "ミレニアムファルコン型ギター",
    desc: "ミレニアム・ファルコンのプラモデルをギター化し、LEDを搭載",
    img: "./assets/MF_F.jpg",
    tags: ["electronic circuit"],
    links: [{ label: "詳細", href: "./projects/falcon_guitar.html" }],
    year: 2019
  },
  {
    id: "lespaul",
    title: "レスポールタイプギター",
    desc: "EMGとLEDで派手に仕上げたメタル志向レスポール",
    img: "./assets/MyLP.jpg",
    tags: ["electronic circuit"],
    links: [{ label: "詳細", href: "./projects/lespaul.html" }],
    year: 2019
  }
];

// Home carousel only
export const HOME_FEATURED_IDS = [
  "fpga-fx",
  "web-nenga",
  "web-cae",
  "strat",
  "tube-booster"
];

export const HOME_FEATURED = HOME_FEATURED_IDS
  .map(id => PROJECTS.find(p => p.id === id))
  .filter(Boolean);
