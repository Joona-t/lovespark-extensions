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

const GROWTH_STAGES = [
  { stage: 0, name: "seed",   minMs: 0,                        label: "A seed planted \ud83c\udf31" },
  { stage: 1, name: "sprout", minMs: 1 * 60 * 60 * 1000,      label: "Growing roots \ud83c\udf3f" },
  { stage: 2, name: "bud",    minMs: 6 * 60 * 60 * 1000,      label: "Reaching for light \ud83c\udf37" },
  { stage: 3, name: "bloom",  minMs: 24 * 60 * 60 * 1000,     label: "In full bloom \ud83c\udf38" },
  { stage: 4, name: "garden", minMs: 7 * 24 * 60 * 60 * 1000, label: "A thriving garden \ud83c\udf3a" }
];
