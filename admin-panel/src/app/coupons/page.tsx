'use client';

import { Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CouponFormDialog } from './components/CouponFormDialog';
import { CouponsTable } from './components/CouponsTable';
import { DeleteCouponDialog } from './components/DeleteCouponDialog';
import { useCouponForm } from './useCouponForm';
import { useCoupons } from './useCoupons';

type CouponsContentProps = {
  coupons: ReturnType<typeof useCoupons>;
  onAdd: () => void;
  onEdit: ReturnType<typeof useCouponForm>['openEdit'];
};

function CouponsContent({ coupons: c, onAdd, onEdit }: CouponsContentProps) {
  if (c.loadFailed && c.coupons.length === 0) {
    return (
      <div className="py-10 text-center text-sm">
        <p>The coupons could not be loaded.</p>
        <Button variant="outline" className="mt-3" onClick={c.retry}>Try again</Button>
      </div>
    );
  }
  if (c.coupons.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground" data-testid="coupons-empty">
        <p>No coupons yet.</p>
        <Button className="mt-3" onClick={onAdd}>Add your first coupon</Button>
      </div>
    );
  }
  return (
    <CouponsTable coupons={c.coupons} busyId={c.busyId} onEdit={onEdit} onToggle={c.toggleActive} onDelete={c.setDeleting} />
  );
}

export default function CouponsPage() {
  const coupons = useCoupons();
  const form = useCouponForm(coupons.load);

  if (coupons.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading coupons...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Create discount codes. Customers enter them at checkout.</p>
        </div>
        <Button onClick={form.openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponsContent coupons={coupons} onAdd={form.openCreate} onEdit={form.openEdit} />
        </CardContent>
      </Card>

      <CouponFormDialog f={form} />
      <DeleteCouponDialog coupon={coupons.deleting} onClose={() => coupons.setDeleting(null)} onConfirm={coupons.confirmDelete} />
    </div>
  );
}
