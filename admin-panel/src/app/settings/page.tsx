"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminApi, ApiError } from "@/lib/api";

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

  const save = async (section: string, keys: string[]) => {
    setSaving(section);
    try {
      const payload: Record<string, string> = {};
      for (const k of keys) payload[k] = settings[k] ?? "";
      const updated = await adminApi.updateSettings(payload);
      setSettings(updated);
      addToast({ type: "success", title: "Saved", description: `${section} updated.` });
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
        <p className="text-muted-foreground">Manage your store settings</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <p className="text-sm text-muted-foreground">Used in the storefront footer, contact page, and order confirmations.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" value={settings["store.name"] ?? ""} onChange={(e) => set("store.name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="storeEmail">Email</Label>
                <Input id="storeEmail" type="email" value={settings["store.email"] ?? ""} onChange={(e) => set("store.email", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storePhone">Phone</Label>
                <Input id="storePhone" value={settings["store.phone"] ?? ""} onChange={(e) => set("store.phone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="storeAddress">Address</Label>
                <Input id="storeAddress" value={settings["store.address"] ?? ""} onChange={(e) => set("store.address", e.target.value)} />
              </div>
            </div>
            <Button
              onClick={() => save("Store Information", ["store.name", "store.email", "store.phone", "store.address"])}
              disabled={saving === "Store Information"}
            >
              {saving === "Store Information" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Settings</CardTitle>
            <p className="text-sm text-muted-foreground">Applied at checkout. Free shipping kicks in once subtotal meets the threshold.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingRate">Flat shipping rate (₹)</Label>
                <Input
                  id="shippingRate"
                  type="number"
                  min="0"
                  step="1"
                  value={settings["shipping.flatRate"] ?? ""}
                  onChange={(e) => set("shipping.flatRate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="freeShipping">Free shipping threshold (₹)</Label>
                <Input
                  id="freeShipping"
                  type="number"
                  min="0"
                  step="1"
                  value={settings["shipping.freeThreshold"] ?? ""}
                  onChange={(e) => set("shipping.freeThreshold", e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() => save("Shipping Settings", ["shipping.flatRate", "shipping.freeThreshold"])}
              disabled={saving === "Shipping Settings"}
            >
              {saving === "Shipping Settings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save shipping settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cash-on-delivery is currently the only checkout option. Adding a Stripe key here is forward-compatible — wire-up will follow once you have a payment provider account.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stripeKey">Stripe Secret Key (placeholder)</Label>
              <Input
                id="stripeKey"
                type="password"
                placeholder="sk_test_..."
                value={settings["payment.stripeKey"] ?? ""}
                onChange={(e) => set("payment.stripeKey", e.target.value)}
              />
            </div>
            <Button
              onClick={() => save("Payment Settings", ["payment.stripeKey"])}
              disabled={saving === "Payment Settings"}
            >
              {saving === "Payment Settings" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save payment settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
