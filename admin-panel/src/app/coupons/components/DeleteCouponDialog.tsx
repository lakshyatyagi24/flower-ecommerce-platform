import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AdminCoupon } from '@/lib/api';

type DeleteCouponDialogProps = {
  coupon: AdminCoupon | null;
  onClose: () => void;
  onConfirm: () => void;
};

function deleteMessage(coupon: AdminCoupon | null): string {
  if (coupon && coupon.usedCount > 0) {
    return `This coupon has been used ${coupon.usedCount} time${coupon.usedCount === 1 ? '' : 's'} and cannot be deleted. Use Deactivate instead; existing orders keep their discount.`;
  }
  return 'This permanently deletes the coupon. Coupons that have been used cannot be deleted; deactivate them instead.';
}

export function DeleteCouponDialog({ coupon, onClose, onConfirm }: DeleteCouponDialogProps) {
  const canDelete = !(coupon && coupon.usedCount > 0);
  return (
    <AlertDialog open={!!coupon} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {coupon?.code}?</AlertDialogTitle>
          <AlertDialogDescription>{deleteMessage(coupon)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
