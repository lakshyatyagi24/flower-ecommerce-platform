import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminOrder } from "@/lib/api";
import type { OrderDetailState } from "../useOrderDetail";
import type { RefundState } from "../useRefundPayment";
import { FulfillmentSection, ShippingEditSection, StatusButtons } from "./FulfillmentSections";
import { CustomerShipping, OrderItemsTable, OrderTotals } from "./OrderSummary";
import { PaymentSection } from "./PaymentSection";

type OrderDetailsDialogProps = {
  detail: OrderDetailState;
  refund: RefundState;
  onCopy: (text: string) => void;
};

function OrderDetailsBody({ order, detail, refund, onCopy }: OrderDetailsDialogProps & { order: AdminOrder }) {
  return (
    <div className="space-y-6">
      <CustomerShipping order={order} />
      <OrderItemsTable items={order.items} />
      <OrderTotals order={order} />
      {order.notes && (
        <div>
          <h3 className="font-semibold mb-1">Customer notes</h3>
          <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
      <PaymentSection order={order} refund={refund} onCopy={onCopy} />
      <FulfillmentSection edit={detail.edit} onField={detail.setEditField} />
      <ShippingEditSection edit={detail.edit} onField={detail.setEditField} />
      <div className="flex flex-wrap items-center gap-2 justify-end border-t pt-4">
        <Button onClick={detail.handleSaveDetails} disabled={detail.savingDetails}>
          {detail.savingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save details
        </Button>
      </div>
      <StatusButtons
        current={order.status}
        disabled={detail.updatingStatus}
        onChange={(status) => detail.handleStatusChange(order.id, status)}
      />
    </div>
  );
}

export function OrderDetailsDialog({ detail, refund, onCopy }: OrderDetailsDialogProps) {
  const { selected, setSelected } = detail;
  return (
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{selected?.id}</DialogTitle>
        </DialogHeader>
        {selected && <OrderDetailsBody order={selected} detail={detail} refund={refund} onCopy={onCopy} />}
      </DialogContent>
    </Dialog>
  );
}
