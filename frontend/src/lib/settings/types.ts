export type StoreUSP = {
  title: string;
  body: string;
};

export type StoreHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export type StoreSocial = {
  facebook: string;
  youtube: string;
  pinterest: string;
};

export type StoreDelivery = {
  cutoffTime: string;
  supportedCities: string;
  supportedPincodes: string;
  businessHours: string;
  leadTimeDays: number;
};

export type StorePolicies = {
  returnsSummary: string;
  deliverySummary: string;
};

export type StoreSeo = {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
};

export type StoreSettings = {
  raw: Record<string, string>;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  gstin: string;
  shippingFlatRate: number;
  shippingFreeThreshold: number;
  hero: StoreHero;
  usps: StoreUSP[];
  social: StoreSocial;
  delivery: StoreDelivery;
  policies: StorePolicies;
  seo: StoreSeo;
};

export const FALLBACK_HERO: StoreHero = {
  eyebrow: "Fresh cut flowers",
  title: "Fresh-cut flowers, arranged with care.",
  subtitle: "Fresh-cut stems for gifting, for your home and for events in Delhi NCR.",
  ctaLabel: "Shop flowers",
  ctaHref: "/products",
};

export const FALLBACK_USPS: StoreUSP[] = [
  { title: "Chosen with care", body: "Stems are selected and prepared for your vase." },
  { title: "Fresh-cut stems", body: "Prepared for your vase." },
  { title: "Careful packing", body: "Wrapped so your flowers arrive in good condition." },
  { title: "Made for occasions", body: "Birthdays, anniversaries, weddings or sympathy: we arrange for every moment." },
];

export const FALLBACK: StoreSettings = {
  raw: {},
  name: "Fresh Petals India",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  instagram: "",
  gstin: "",
  shippingFlatRate: 99,
  shippingFreeThreshold: 1499,
  hero: FALLBACK_HERO,
  usps: FALLBACK_USPS,
  social: { facebook: "", youtube: "", pinterest: "" },
  delivery: { cutoffTime: "", supportedCities: "", supportedPincodes: "", businessHours: "", leadTimeDays: 1 },
  policies: { returnsSummary: "", deliverySummary: "" },
  seo: { metaTitle: "", metaDescription: "", ogImage: "" },
};
