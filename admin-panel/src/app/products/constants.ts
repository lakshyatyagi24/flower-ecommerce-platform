import type { AdminProductType } from "@/lib/api";

export const PRODUCT_TYPES: { value: AdminProductType; label: string }[] = [
  { value: "CUT_FLOWER", label: "Cut flower" },
  { value: "PLANT", label: "Plant" },
  { value: "BOUQUET", label: "Bouquet" },
  { value: "ARRANGEMENT", label: "Arrangement" },
  { value: "HAMPER", label: "Hamper" },
];

export const UNIT_OPTIONS = [
  { value: "piece", label: "Piece" },
  { value: "stem", label: "Stem" },
  { value: "bunch", label: "Bunch" },
  { value: "box", label: "Box" },
  { value: "kg", label: "Kg" },
];

export const OCCASION_TAGS = ["birthday", "anniversary", "wedding", "corporate", "sympathy", "congratulations", "get-well-soon", "just-because"];
