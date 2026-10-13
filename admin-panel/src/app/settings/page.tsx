"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminApi, ApiError } from "@/lib/api";

// Sections are grouped collections of settings keys. Adding a new key here automatically
// gives the admin a UI to edit it — the backend stores arbitrary key/value pairs.
type FieldType = "text" | "email" | "tel" | "number" | "password" | "textarea" | "url";
type Field = {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
};

// Values that look like leftover seed/placeholder text. Mirrors the storefront's isPlaceholderSetting, which
// hides such values from customers; the admin should replace them before launch.
const PLACEHOLDER_RE = /example\.com|please update|placeholder|lorem ipsum/i;
const isPlaceholderValue = (v: string | undefined) => !!v && PLACEHOLDER_RE.test(v);
type Section = {
  id: string;
  title: string;
  description: string;
  fields: Field[];
};

// Settings the storefront does not read yet are intentionally NOT listed here (homepage.hero*, seo.*,
// delivery.cutoffTime / supportedPincodes / leadTimeDays). Their database rows are left untouched: a section save only
// writes the keys listed below. Add them back when the storefront starts honouring them.
const SECTIONS: Section[] = [
  {
    id: "store",
    title: "Store Information",
    description: "Used in the storefront footer and contact page.",
    fields: [
      { key: "store.name", label: "Store name", placeholder: "Fresh Petals India" },
      { key: "store.email", label: "Contact email", type: "email", placeholder: "orders@example.com" },
      { key: "store.phone", label: "Phone", type: "tel", placeholder: "+91 99999 11111" },
      { key: "store.whatsapp", label: "WhatsApp number", type: "tel", placeholder: "+91 99999 11111", hint: "Used for the floating WhatsApp button and product enquiries." },
      { key: "store.address", label: "Address", placeholder: "Delhi NCR, India" },
      { key: "store.gstin", label: "GSTIN", placeholder: "07ABCDE1234F1Z5", hint: "Shown on invoices when present." },
    ],
  },
  {
    id: "social",
    title: "Social Links",
    description: "Used in the footer and contact page. Leave blank to hide.",
    fields: [
      { key: "store.instagram", label: "Instagram", placeholder: "freshpetalsindia or full URL" },
      { key: "social.facebook", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/freshpetalsindia" },
      { key: "social.youtube", label: "YouTube URL", type: "url", placeholder: "https://youtube.com/@freshpetalsindia" },
      { key: "social.pinterest", label: "Pinterest URL", type: "url", placeholder: "https://pinterest.com/freshpetalsindia" },
    ],
  },
  {
    id: "announcement",
    title: "Announcement bar",
    description: "An optional one-line bar shown above the storefront header. Leave the text empty to hide it.",
    fields: [
      {
        key: "homepage.announcement",
        label: "Announcement text",
        placeholder: "Short announcement shown above the header (leave empty to hide)",
        maxLength: 140,
        hint: "Up to 140 characters. Visitors can dismiss it for the rest of their visit.",
      },
      {
        key: "homepage.announcementHref",
        label: "Announcement link (optional)",
        placeholder: "/products",
        hint: "A page on this site, like /products or /occasions/wedding. External links are ignored. Leave empty for plain text.",
      },
    ],
  },
  {
    id: "usps",
    title: "USP / Trust Bar",
    description: "Up to four short value propositions shown on the homepage and product pages.",
    fields: [
      { key: "trust.usp1Title", label: "USP 1 title", placeholder: "Chosen with care" },
      { key: "trust.usp1Body", label: "USP 1 body", placeholder: "Stems are selected and prepared for your vase." },
      { key: "trust.usp2Title", label: "USP 2 title", placeholder: "Delivery across Delhi NCR" },
      { key: "trust.usp2Body", label: "USP 2 body", placeholder: "Only state what you can always deliver." },
      { key: "trust.usp3Title", label: "USP 3 title", placeholder: "If something is wrong" },
      { key: "trust.usp3Body", label: "USP 3 body", placeholder: "Tell us and we will make it right (describe your real policy)." },
      { key: "trust.usp4Title", label: "USP 4 title", placeholder: "Made for occasions" },
      { key: "trust.usp4Body", label: "USP 4 body", placeholder: "Birthdays, anniversaries, weddings, sympathy — we craft for every moment." },
    ],
  },
  {
    id: "delivery",
    title: "Delivery Settings",
    description: "Service area and timing rules shown across the storefront.",
    fields: [
      { key: "delivery.supportedCities", label: "Supported cities", type: "textarea", rows: 2, placeholder: "Delhi NCR", hint: "The first city is used in product page descriptions (search results and link previews). Comma-separated." },
      { key: "delivery.businessHours", label: "Business hours", placeholder: "Mon–Sun, 8am–9pm" },
    ],
  },
  {
    id: "shipping",
    title: "Shipping Charges",
    description: "Applied at checkout. Free shipping kicks in once subtotal meets the threshold.",
    fields: [
      { key: "shipping.flatRate", label: "Flat shipping rate (₹)", type: "number", placeholder: "99" },
      { key: "shipping.freeThreshold", label: "Free shipping threshold (₹)", type: "number", placeholder: "1499" },
    ],
  },
  {
    id: "policies",
    title: "Policies",
    description: "Short summaries surfaced near checkout and on product pages.",
    fields: [
      { key: "policies.returnsSummary", label: "Returns / replacement", type: "textarea", rows: 3, placeholder: "We will replace or refund any flowers that arrive less than fresh." },
      { key: "policies.deliverySummary", label: "Delivery promise", type: "textarea", rows: 3, placeholder: "Describe how orders are delivered." },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getAdminSettings()
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Failed to load settings";
        addToast({ type: "error", title: "Error", description: message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const set = (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const saveSection = async (section: Section) => {
    setSaving(section.id);
    try {
      const payload: Record<string, string> = {};
      for (const f of section.fields) payload[f.key] = settings[f.key] ?? "";
      const updated = await adminApi.updateSettings(payload);
      setSettings(updated);
      addToast({ type: "success", title: "Saved", description: `${section.title} updated.` });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Save failed";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage every setting your storefront reads — store info, hero copy, USPs, delivery and more.
        </p>
      </div>

      <div className="grid gap-6">
        {SECTIONS.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field) => {
                  const isWide = field.type === "textarea";
                  return (
                    <div key={field.key} className={isWide ? "md:col-span-2" : ""}>
                      <Label htmlFor={field.key}>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <textarea
                          id={field.key}
                          rows={field.rows ?? 3}
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          value={settings[field.key] ?? ""}
                          onChange={(e) => set(field.key, e.target.value)}
                          className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type ?? "text"}
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          value={settings[field.key] ?? ""}
                          onChange={(e) => set(field.key, e.target.value)}
                        />
                      )}
                      {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
                      {isPlaceholderValue(settings[field.key]) && (
                        <p role="alert" className="mt-1 text-xs font-medium text-amber-700">
                          This looks like placeholder text — replace it before launch.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button onClick={() => saveSection(section)} disabled={saving === section.id}>
                {saving === section.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save {section.title.toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
