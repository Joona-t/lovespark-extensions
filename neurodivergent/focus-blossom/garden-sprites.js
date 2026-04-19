const FLOWER_TYPES = [
  {
    name: "Cherry Blossom",
    petalColor: "#FFB7C5",
    petalColorLight: "#FFD6E0",
    centerColor: "#FFD700",
    stemColor: "#90EE90",
    leafColor: "#77DD77",
    petalShape: "round",
    petalCount: 5,
    maxFlowers: 12,
    bloomPattern: "cluster"
  },
  {
    name: "Rose Garden",
    petalColor: "#FF69B4",
    petalColorLight: "#FFB3D9",
    centerColor: "#FF1493",
    stemColor: "#228B22",
    leafColor: "#32CD32",
    petalShape: "pointed",
    petalCount: 8,
    maxFlowers: 8,
    bloomPattern: "scattered"
  },
  {
    name: "Lavender Field",
    petalColor: "#C084FC",
    petalColorLight: "#DDB8FF",
    centerColor: "#9B59B6",
    stemColor: "#6B8E23",
    leafColor: "#8FBC8F",
    petalShape: "round",
    petalCount: 4,
    maxFlowers: 20,
    bloomPattern: "row"
  },
  {
    name: "Sunflower Patch",
    petalColor: "#FFD700",
    petalColorLight: "#FFE44D",
    centerColor: "#8B4513",
    stemColor: "#228B22",
    leafColor: "#32CD32",
    petalShape: "pointed",
    petalCount: 12,
    maxFlowers: 6,
    bloomPattern: "scattered"
  },
  {
    name: "Lotus Pond",
    petalColor: "#FFB3D9",
    petalColorLight: "#FFCCE5",
    centerColor: "#FF69B4",
    stemColor: "#3CB371",
    leafColor: "#66CDAA",
    petalShape: "heart",
    petalCount: 6,
    maxFlowers: 10,
    bloomPattern: "cluster"
  }
];

// Stage data. `label` is the English fallback — actual displayed text is looked up via
// chrome.i18n.getMessage("stage{N}Label") with this string used only when i18n is
// unavailable (e.g. the _cws/ mock harness). labelKey is the canonical i18n key.
const GROWTH_STAGES = [
  { stage: 0, name: "seed",   minMs: 0,                        labelKey: "stage0Label", label: "A seed planted \ud83c\udf31" },
  { stage: 1, name: "sprout", minMs: 1 * 60 * 60 * 1000,      labelKey: "stage1Label", label: "Growing roots \ud83c\udf3f" },
  { stage: 2, name: "bud",    minMs: 6 * 60 * 60 * 1000,      labelKey: "stage2Label", label: "Reaching for light \ud83c\udf37" },
  { stage: 3, name: "bloom",  minMs: 24 * 60 * 60 * 1000,     labelKey: "stage3Label", label: "In full bloom \ud83c\udf38" },
  { stage: 4, name: "garden", minMs: 7 * 24 * 60 * 60 * 1000, labelKey: "stage4Label", label: "A thriving garden \ud83c\udf3a" }
];

function stageLabel(stage) {
  const s = GROWTH_STAGES[stage];
  if (!s) return "";
  if (typeof chrome !== "undefined" && chrome.i18n) {
    const m = chrome.i18n.getMessage(s.labelKey);
    if (m) return m;
  }
  return s.label;
}
