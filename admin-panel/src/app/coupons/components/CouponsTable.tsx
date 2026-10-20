import { Edit, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminCoupon } from '@/lib/api';
import { couponStatus, describeCoupon, expiryToDateInput } from '@/lib/coupon-form';

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
  expired: 'bg-amber-100 text-amber-800',
  'used up': 'bg-amber-100 text-amber-800',
};

type CouponsTableProps = {
  coupons: AdminCoupon[];
  busyId: number | null;
  onEdit: (coupon: AdminCoupon) => void;
  onToggle: (coupon: AdminCoupon) => void;
  onDelete: (coupon: AdminCoupon) => void;
};

type RowProps = Omit<CouponsTableProps, 'coupons'> & { coupon: AdminCoupon };

function RowActions({ coupon: c, busyId, onEdit, onToggle, onDelete }: RowProps) {
  const busy = busyId === c.id;
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => onEdit(c)} aria-label={`Edit ${c.code}`}>
        <Edit className="h-3 w-3" />
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => onToggle(c)}>
        {c.active ? 'Deactivate' : 'Activate'}
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => onDelete(c)} aria-label={`Delete ${c.code}`}>
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function CouponRow(props: RowProps) {
  const c = props.coupon;
  const status = couponStatus(c);
  return (
    <TableRow>
      <TableCell className="font-mono">{c.code}</TableCell>
      <TableCell>{describeCoupon(c)}</TableCell>
      <TableCell>{c.minSubtotal > 0 ? `₹${c.minSubtotal}` : '-'}</TableCell>
      <TableCell>{c.expiresAt ? expiryToDateInput(c.expiresAt) : 'Never'}</TableCell>
      <TableCell>{c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : ''}</TableCell>
      <TableCell>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{status}</span>
      </TableCell>
      <TableCell>
        <RowActions {...props} />
      </TableCell>
    </TableRow>
  );
}

const COLUMNS = ['Code', 'Discount', 'Min. subtotal', 'Expires', 'Used', 'Status', 'Actions'];

export function CouponsTable({ coupons, ...actions }: CouponsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {coupons.map((c) => (
          <CouponRow key={c.id} coupon={c} {...actions} />
        ))}
      </TableBody>
    </Table>
  );
}
