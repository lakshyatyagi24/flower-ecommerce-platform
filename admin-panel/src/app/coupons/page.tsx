'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import { adminApi, AdminCoupon, ApiError } from '@/lib/api';
import {
  blankCouponForm, couponStatus, couponToForm, CouponErrors, CouponFormState, describeCoupon, expiryToDateInput,
  formToInput, normalizeCode, validateCouponForm,
} from '@/lib/coupon-form';

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
  expired: 'bg-amber-100 text-amber-800',
  'used up': 'bg-amber-100 text-amber-800',
};

function FieldError({ id, message }: { id: string; message?: string }) {
  // Inline, not role=alert: the submit handler moves focus to the first invalid field instead.
  return message ? <p id={id} className="mt-1 text-xs text-red-700">{message}</p> : null;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(blankCouponForm());
  const [errors, setErrors] = useState<CouponErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminCoupon | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    try {
      setCoupons(await adminApi.listCoupons());
      setLoadFailed(false);
    } catch (error) {
      setLoadFailed(true);
      addToast({ type: 'error', title: 'Error', description: error instanceof ApiError ? error.message : 'Failed to load coupons.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof CouponFormState>(k: K, v: CouponFormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(blankCouponForm());
    setErrors({});
    setFormError('');
    setOpen(true);
  };
  const openEdit = (c: AdminCoupon) => {
    setEditing(c);
    setForm(couponToForm(c));
    setErrors({});
    setFormError('');
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCouponForm(form, !editing);
    setErrors(found);
    setFormError('');
    const first = (['code', 'value', 'minSubtotal', 'maxDiscount', 'expiresOn', 'maxUses'] as const).find((k) => found[k]);
    if (first) {
      document.getElementById(`coupon-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const input = formToInput(form);
      if (editing) {
        const { code: _code, ...rest } = input; // eslint-disable-line @typescript-eslint/no-unused-vars
        await adminApi.updateCoupon(editing.id, rest);
      } else {
        await adminApi.createCoupon(input);
      }
      setOpen(false);
      await load();
      addToast({ type: 'success', title: 'Success', description: `Coupon ${editing ? 'updated' : 'created'}.` });
    } catch (error) {
      // Keep the dialog and the typed values so the admin can fix and retry.
      setFormError(error instanceof ApiError ? error.message : 'Failed to save the coupon.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: AdminCoupon) => {
    setBusyId(c.id);
    try {
      const { code: _code, ...rest } = { ...formToInput(couponToForm(c)), active: !c.active }; // eslint-disable-line @typescript-eslint/no-unused-vars
      await adminApi.updateCoupon(c.id, rest);
      await load();
    } catch (error) {
      addToast({ type: 'error', title: 'Error', description: error instanceof ApiError ? error.message : 'Failed to update the coupon.' });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setBusyId(target.id);
    try {
      await adminApi.deleteCoupon(target.id);
      setDeleting(null);
      await load();
      addToast({ type: 'success', title: 'Success', description: 'Coupon deleted.' });
    } catch (error) {
      setDeleting(null);
      addToast({ type: 'error', title: 'Could not delete', description: error instanceof ApiError ? error.message : 'Failed to delete the coupon.' });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading coupons...</span>
      </div>
    );
  }

  const describedBy = (k: keyof CouponErrors) => (errors[k] ? `coupon-${k}-error` : undefined);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Create discount codes. Customers enter them at checkout.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {loadFailed && coupons.length === 0 ? (
            <div className="py-10 text-center text-sm">
              <p>The coupons could not be loaded.</p>
              <Button variant="outline" className="mt-3" onClick={() => { setLoading(true); load(); }}>Try again</Button>
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground" data-testid="coupons-empty">
              <p>No coupons yet.</p>
              <Button className="mt-3" onClick={openCreate}>Add your first coupon</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. subtotal</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => {
                  const status = couponStatus(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.code}</TableCell>
                      <TableCell>{describeCoupon(c)}</TableCell>
                      <TableCell>{c.minSubtotal > 0 ? `₹${c.minSubtotal}` : '-'}</TableCell>
                      <TableCell>{c.expiresAt ? expiryToDateInput(c.expiresAt) : 'Never'}</TableCell>
                      <TableCell>{c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : ''}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{status}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.code}`}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => toggleActive(c)}>
                            {c.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button variant="outline" size="sm" disabled={busyId === c.id} onClick={() => setDeleting(c)} aria-label={`Delete ${c.code}`}>
                            {busyId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.code}` : 'Add coupon'}</DialogTitle>
            <DialogDescription>
              {editing ? 'The code cannot be changed after it is created.' : 'Codes are saved in capitals.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-4 mt-2">
            <div>
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                value={form.code}
                onChange={(e) => set('code', normalizeCode(e.target.value))}
                disabled={saving || !!editing}
                maxLength={32}
                autoComplete="off"
                aria-invalid={!!errors.code}
                aria-describedby={describedBy('code')}
              />
              <FieldError id="coupon-code-error" message={errors.code} />
            </div>
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
              <div>
                <Label htmlFor="coupon-value">{form.type === 'PERCENT' ? 'Percent (1-100)' : 'Amount (₹)'}</Label>
                <Input
                  id="coupon-value"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  disabled={saving}
                  aria-invalid={!!errors.value}
                  aria-describedby={describedBy('value')}
                />
                <FieldError id="coupon-value-error" message={errors.value} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-minSubtotal">Minimum subtotal (₹)</Label>
                <Input
                  id="coupon-minSubtotal"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={form.minSubtotal}
                  onChange={(e) => set('minSubtotal', e.target.value)}
                  disabled={saving}
                  placeholder="0"
                  aria-invalid={!!errors.minSubtotal}
                  aria-describedby={describedBy('minSubtotal')}
                />
                <FieldError id="coupon-minSubtotal-error" message={errors.minSubtotal} />
              </div>
              {form.type === 'PERCENT' && (
                <div>
                  <Label htmlFor="coupon-maxDiscount">Max discount (₹)</Label>
                  <Input
                    id="coupon-maxDiscount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={form.maxDiscount}
                    onChange={(e) => set('maxDiscount', e.target.value)}
                    disabled={saving}
                    placeholder="No cap"
                    aria-invalid={!!errors.maxDiscount}
                    aria-describedby={describedBy('maxDiscount')}
                  />
                  <FieldError id="coupon-maxDiscount-error" message={errors.maxDiscount} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-expiresOn">Expires on (last valid day)</Label>
                <Input
                  id="coupon-expiresOn"
                  type="date"
                  value={form.expiresOn}
                  onChange={(e) => set('expiresOn', e.target.value)}
                  disabled={saving}
                  aria-invalid={!!errors.expiresOn}
                  aria-describedby={describedBy('expiresOn')}
                />
                <FieldError id="coupon-expiresOn-error" message={errors.expiresOn} />
              </div>
              <div>
                <Label htmlFor="coupon-maxUses">Max uses</Label>
                <Input
                  id="coupon-maxUses"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={form.maxUses}
                  onChange={(e) => set('maxUses', e.target.value)}
                  disabled={saving}
                  placeholder="Unlimited"
                  aria-invalid={!!errors.maxUses}
                  aria-describedby={describedBy('maxUses')}
                />
                <FieldError id="coupon-maxUses-error" message={errors.maxUses} />
              </div>
            </div>
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.usedCount > 0
                ? `This coupon has been used ${deleting.usedCount} time${deleting.usedCount === 1 ? '' : 's'} and cannot be deleted. Use Deactivate instead; existing orders keep their discount.`
                : 'This permanently deletes the coupon. Coupons that have been used cannot be deleted; deactivate them instead.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!(deleting && deleting.usedCount > 0) && (
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
