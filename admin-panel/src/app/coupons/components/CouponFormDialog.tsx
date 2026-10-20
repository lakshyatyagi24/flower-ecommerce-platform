import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { normalizeCode } from '@/lib/coupon-form';
import type { CouponFormHook } from '../useCouponForm';
import { CouponField, DECIMAL_PROPS } from './CouponFields';

function TypeValueRow({ f }: { f: CouponFormHook }) {
  const { form, set, errors, saving } = f;
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="coupon-type">Type</Label>
        <select
          id="coupon-type"
          value={form.type}
          onChange={(e) => set('type', e.target.value as 'PERCENT' | 'FLAT')}
          disabled={saving}
          className="w-full p-2 border rounded bg-background"
        >
          <option value="PERCENT">Percentage off</option>
          <option value="FLAT">Flat amount off</option>
        </select>
      </div>
      <CouponField
        name="value"
        label={form.type === 'PERCENT' ? 'Percent (1-100)' : 'Amount (₹)'}
        {...DECIMAL_PROPS}
        value={form.value}
        onValue={(v) => set('value', v)}
        disabled={saving}
        error={errors.value}
      />
    </div>
  );
}

function LimitsRow({ f }: { f: CouponFormHook }) {
  const { form, set, errors, saving } = f;
  return (
    <div className="grid grid-cols-2 gap-4">
      <CouponField
        name="minSubtotal"
        label="Minimum subtotal (₹)"
        {...DECIMAL_PROPS}
        value={form.minSubtotal}
        onValue={(v) => set('minSubtotal', v)}
        disabled={saving}
        placeholder="0"
        error={errors.minSubtotal}
      />
      {form.type === 'PERCENT' && (
        <CouponField
          name="maxDiscount"
          label="Max discount (₹)"
          {...DECIMAL_PROPS}
          value={form.maxDiscount}
          onValue={(v) => set('maxDiscount', v)}
          disabled={saving}
          placeholder="No cap"
          error={errors.maxDiscount}
        />
      )}
    </div>
  );
}

function ExpiryUsesRow({ f }: { f: CouponFormHook }) {
  const { form, set, errors, saving } = f;
  return (
    <div className="grid grid-cols-2 gap-4">
      <CouponField
        name="expiresOn"
        label="Expires on (last valid day)"
        type="date"
        value={form.expiresOn}
        onValue={(v) => set('expiresOn', v)}
        disabled={saving}
        error={errors.expiresOn}
      />
      <CouponField
        name="maxUses"
        label="Max uses"
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        value={form.maxUses}
        onValue={(v) => set('maxUses', v)}
        disabled={saving}
        placeholder="Unlimited"
        error={errors.maxUses}
      />
    </div>
  );
}

function FormFields({ f }: { f: CouponFormHook }) {
  const { form, set, errors, saving, editing } = f;
  return (
    <>
      <CouponField
        name="code"
        label="Code"
        value={form.code}
        onValue={(v) => set('code', normalizeCode(v))}
        disabled={saving || !!editing}
        maxLength={32}
        autoComplete="off"
        error={errors.code}
      />
      <TypeValueRow f={f} />
      <LimitsRow f={f} />
      <ExpiryUsesRow f={f} />
    </>
  );
}

export function CouponFormDialog({ f }: { f: CouponFormHook }) {
  const { form, set, saving, editing, formError } = f;
  return (
    <Dialog open={f.open} onOpenChange={(o) => !saving && f.setOpen(o)}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.code}` : 'Add coupon'}</DialogTitle>
          <DialogDescription>
            {editing ? 'The code cannot be changed after it is created.' : 'Codes are saved in capitals.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={f.submit} noValidate className="space-y-4 mt-2">
          <FormFields f={f} />
          {editing && (
            <p className="text-sm" data-testid="coupon-used">
              Used so far: <strong>{editing.usedCount}</strong>
            </p>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} disabled={saving} />
            <span className="text-sm">Active (customers can use it)</span>
          </label>
          {formError && <p className="text-sm text-red-700" data-testid="coupon-form-error">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => f.setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
