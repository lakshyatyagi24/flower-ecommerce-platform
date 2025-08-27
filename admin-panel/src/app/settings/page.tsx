import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your store settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" defaultValue="Flower Shop" />
              </div>
              <div>
                <Label htmlFor="storeEmail">Email</Label>
                <Input id="storeEmail" type="email" defaultValue="info@flowershop.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="storeAddress">Address</Label>
              <Input id="storeAddress" defaultValue="123 Flower Street, City, State 12345" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="stripeKey">Stripe Secret Key</Label>
              <Input id="stripeKey" type="password" placeholder="sk_test_..." />
            </div>
            <Button>Update Payment Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingRate">Base Shipping Rate</Label>
                <Input id="shippingRate" type="number" defaultValue="5.99" />
              </div>
              <div>
                <Label htmlFor="freeShipping">Free Shipping Threshold</Label>
                <Input id="freeShipping" type="number" defaultValue="50" />
              </div>
            </div>
            <Button>Save Shipping Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
