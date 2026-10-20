'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi, AdminCoupon } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { errorMessage } from '@/lib/error-message';

export function useCoupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deleting, setDeleting] = useState<AdminCoupon | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    try {
      setCoupons(await adminApi.listCoupons());
      setLoadFailed(false);
    } catch (error) {
      setLoadFailed(true);
      addToast({ type: 'error', title: 'Error', description: errorMessage(error, 'Failed to load coupons.') });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setLoading(true);
    load();
  };

  const toggleActive = async (c: AdminCoupon) => {
    setBusyId(c.id);
    try {
      // Only the flag: the server merges the rest, so expiry, limits and value are never re-sent or rewritten.
      await adminApi.updateCoupon(c.id, { active: !c.active });
      await load();
    } catch (error) {
      addToast({ type: 'error', title: 'Error', description: errorMessage(error, 'Failed to update the coupon.') });
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
      addToast({ type: 'error', title: 'Could not delete', description: errorMessage(error, 'Failed to delete the coupon.') });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return { coupons, loading, loadFailed, load, retry, deleting, setDeleting, busyId, toggleActive, confirmDelete };
}
