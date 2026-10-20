'use client';

import { useState } from 'react';
import { adminApi, AdminCoupon } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/error-message';
import {
  blankCouponForm, couponToForm, CouponErrors, CouponFormState, formToInput, validateCouponForm,
} from '@/lib/coupon-form';

const FIELD_ORDER = ['code', 'value', 'minSubtotal', 'maxDiscount', 'expiresOn', 'maxUses'] as const;

export function useCouponForm(reload: () => Promise<void>) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(blankCouponForm());
  const [errors, setErrors] = useState<CouponErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const set = <K extends keyof CouponFormState>(k: K, v: CouponFormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openWith = (coupon: AdminCoupon | null) => {
    setEditing(coupon);
    setForm(coupon ? couponToForm(coupon) : blankCouponForm());
    setErrors({});
    setFormError('');
    setOpen(true);
  };

  const persist = async () => {
    const input = formToInput(form);
    if (editing) {
      const { code: _code, ...rest } = input; // eslint-disable-line @typescript-eslint/no-unused-vars
      await adminApi.updateCoupon(editing.id, rest);
    } else {
      await adminApi.createCoupon(input);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCouponForm(form, !editing);
    setErrors(found);
    setFormError('');
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) {
      document.getElementById(`coupon-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      await persist();
      setOpen(false);
      await reload();
      addToast({ type: 'success', title: 'Success', description: `Coupon ${editing ? 'updated' : 'created'}.` });
    } catch (error) {
      // Keep the dialog and the typed values so the admin can fix and retry.
      setFormError(errorMessage(error, 'Failed to save the coupon.'));
    } finally {
      setSaving(false);
    }
  };

  return {
    open,
    setOpen,
    editing,
    form,
    set,
    errors,
    formError,
    saving,
    openCreate: () => openWith(null),
    openEdit: (c: AdminCoupon) => openWith(c),
    submit,
  };
}

export type CouponFormHook = ReturnType<typeof useCouponForm>;
