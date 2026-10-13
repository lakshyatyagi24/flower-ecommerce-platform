"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminApi, AdminOrder, ApiError } from "@/lib/api";
import { formatDeliveryDate } from "@/lib/delivery-date";
import { hasCaptureTrace, paymentBadge, splitRefundNote } from "@/lib/refund-note";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
}

function badgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PENDING":
      return "outline";
    case "PAID":
      return "default";
    case "SHIPPED":
      return "secondary";
    case "COMPLETED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

const ATTENTION_VALUES = ["refund", "mismatch", "awaiting"] as const;

const NOTE_CHANGED_MSG = "The note was changed meanwhile";

function toneVariant(tone: "neutral" | "success" | "warning" | "danger"): "default" | "secondary" | "destructive" | "outline" {
  switch (tone) {
    case "success":
      return "default";
    case "warning":
      return "secondary";
    case "danger":
      return "destructive";
    default:
      return "outline";
  }
}

function PaymentBadge({ order }: { order: AdminOrder }) {
  const b = paymentBadge(order);
  return (
    <Badge variant={toneVariant(b.tone)} title={b.hint}>
      {b.label}
    </Badge>
  );
}

type EditState = {
  trackingNumber: string;
  courierName: string;
  adminNotes: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  customerPhone: string;
};

const blankEdit: EditState = {
  trackingNumber: "",
  courierName: "",
  adminNotes: "",
  shippingAddress: "",
  city: "",
  postalCode: "",
  customerPhone: "",
};

function editFromOrder(o: AdminOrder): EditState {
  return {
    trackingNumber: o.trackingNumber || "",
    courierName: o.courierName || "",
    adminNotes: o.adminNotes || "",
    shippingAddress: o.shippingAddress || "",
    city: o.city || "",
    postalCode: o.postalCode || "",
    customerPhone: o.customerPhone || "",
  };
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const searchParams = useSearchParams();
  const initialAttention = searchParams.get("attention") ?? "";
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [attentionFilter, setAttentionFilter] = useState<string>(
    (ATTENTION_VALUES as readonly string[]).includes(initialAttention) ? initialAttention : "",
  );
  // "" = newest first; "deliveryDate" = soonest delivery date first (orders without one last).
  const [sortBy, setSortBy] = useState<"" | "deliveryDate">("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [edit, setEdit] = useState<EditState>(blankEdit);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  // Payment section state (admin part of the refund note only; system lines are read-only).
  const [refundAdmin, setRefundAdmin] = useState("");
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { addToast } = useToast();

  const reqRef = useRef(0);
  const fetchOrders = useCallback(async () => {
    // Only the latest request may touch state (rapid filter changes / post-save refetch).
    const id = ++reqRef.current;
    setLoading(true);
    try {
      const res = await adminApi.listOrders({
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        paymentMethod: paymentMethodFilter || undefined,
        attention: attentionFilter || undefined,
        sort: sortBy || undefined,
        take: 200,
      });
      if (id !== reqRef.current) return;
      setOrders(res.items);
    } catch (err) {
      if (id !== reqRef.current) return;
      const message = err instanceof ApiError ? err.message : "Failed to load orders";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [statusFilter, paymentStatusFilter, paymentMethodFilter, attentionFilter, sortBy, addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sync the edit form whenever a different order is selected.
  useEffect(() => {
    setEdit(selected ? editFromOrder(selected) : blankEdit);
  }, [selected]);

  // The refund note textarea resets only when a different order is opened, so an unrelated action
  // (status change, Save details, refetch) never wipes what the admin is typing.
  const noteOrderIdRef = useRef<number | null>(null);
  useEffect(() => {
    const id = selected?.id ?? null;
    if (id === noteOrderIdRef.current) return;
    noteOrderIdRef.current = id;
    setRefundAdmin(splitRefundNote(selected?.refundNote).admin);
    setConfirmingRefund(false);
  }, [selected]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ type: "success", title: "Copied", description: text });
    } catch {
      addToast({ type: "error", title: "Copy failed", description: "Select the text and copy it manually." });
    }
  };

  // Saves the admin note and/or marks the order refunded. The server keeps the system lines itself.
  const submitPayment = async (markRefunded: boolean) => {
    if (!selected || paymentBusy) return;
    setPaymentBusy(true);
    setPaymentError(null);
    const typed = refundAdmin;
    try {
      const updated = await adminApi.updateOrder(
        selected.id,
        markRefunded ? { paymentStatus: "REFUNDED", refundNote: typed } : { refundNote: typed },
      );
      setSelected(updated);
      setRefundAdmin(splitRefundNote(updated.refundNote).admin);
      addToast({
        type: "success",
        title: markRefunded ? "Marked refunded" : "Note saved",
        description: markRefunded ? `Order #${selected.id} is now refunded.` : "Payment note updated.",
      });
      fetchOrders();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      addToast({ type: "error", title: "Error", description: message });
      if (err instanceof ApiError && err.status === 409) {
        // Reload so the screen shows the real state; keep the typed note when only the note raced.
        try {
          const fresh = await adminApi.getOrder(selected.id);
          setSelected(fresh);
          if (!message.includes(NOTE_CHANGED_MSG)) setRefundAdmin(splitRefundNote(fresh.refundNote).admin);
        } catch {}
        fetchOrders();
      }
      setPaymentError(message);
    } finally {
      setPaymentBusy(false);
      setConfirmingRefund(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdatingStatus(true);
    try {
      const updated = await adminApi.updateOrderStatus(orderId, status);
      setSelected(updated);
      addToast({ type: "success", title: "Status updated", description: `Order #${orderId} is now ${status}.` });
      fetchOrders();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selected) return;
    setSavingDetails(true);
    try {
      const updated = await adminApi.updateOrder(selected.id, {
        trackingNumber: edit.trackingNumber.trim() || null,
        courierName: edit.courierName.trim() || null,
        adminNotes: edit.adminNotes.trim() || null,
        shippingAddress: edit.shippingAddress.trim() || null,
        city: edit.city.trim() || null,
        postalCode: edit.postalCode.trim() || null,
        customerPhone: edit.customerPhone.trim() || null,
      });
      setSelected(updated);
      addToast({ type: "success", title: "Saved", description: "Order details updated." });
      fetchOrders();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders, tracking and fulfillment notes.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <Label htmlFor="statusFilter">Order status</Label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block p-2 border rounded text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="paymentStatusFilter">Payment status</Label>
          <select
            id="paymentStatusFilter"
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="mt-1 block p-2 border rounded text-sm"
          >
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
        <div>
          <Label htmlFor="paymentMethodFilter">Payment method</Label>
          <select
            id="paymentMethodFilter"
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="mt-1 block p-2 border rounded text-sm"
          >
            <option value="">All</option>
            <option value="RAZORPAY">Online</option>
            <option value="COD">COD</option>
          </select>
        </div>
        <div>
          <Label htmlFor="attentionFilter">Attention</Label>
          <select
            id="attentionFilter"
            value={attentionFilter}
            onChange={(e) => setAttentionFilter(e.target.value)}
            className="mt-1 block p-2 border rounded text-sm"
          >
            <option value="">All</option>
            <option value="refund">Refunds owed</option>
            <option value="mismatch">Check payment</option>
            <option value="awaiting">Awaiting payment</option>
          </select>
        </div>
        <div>
          <Label htmlFor="sortBy">Sort by</Label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value === "deliveryDate" ? "deliveryDate" : "")}
            className="mt-1 block p-2 border rounded text-sm"
          >
            <option value="">Newest first</option>
            <option value="deliveryDate">Delivery date (soonest first)</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {statusFilter || paymentStatusFilter || paymentMethodFilter || attentionFilter
                ? "No orders match these filters."
                : "No orders yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Deliver on</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className={paymentBadge(o).attention ? "bg-destructive/10" : undefined}>
                    <TableCell className="font-mono">#{o.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customerName ?? "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                    </TableCell>
                    <TableCell>{o.items.reduce((s, it) => s + it.quantity, 0)} items</TableCell>
                    <TableCell>{formatINR(o.total)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(o.status)}>{o.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground mb-1">
                        {o.paymentMethod === "RAZORPAY" ? "Online" : o.paymentMethod}
                      </div>
                      <PaymentBadge order={o} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.trackingNumber ? (
                        <div>
                          <div className="font-mono">{o.trackingNumber}</div>
                          {o.courierName && <div className="text-muted-foreground">{o.courierName}</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDeliveryDate(o.deliveryDate) || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => { setPaymentError(null); setSelected(o); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">Customer</h3>
                  <div>{selected.customerName ?? "Guest"}</div>
                  <div className="text-muted-foreground">{selected.customerEmail}</div>
                  {selected.customerPhone && <div className="text-muted-foreground">{selected.customerPhone}</div>}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Shipping</h3>
                  <div className="font-medium">
                    Delivery date: {formatDeliveryDate(selected.deliveryDate) || "not set (older order)"}
                  </div>
                  <div className="whitespace-pre-wrap">{selected.shippingAddress}</div>
                  {(selected.city || selected.postalCode) && (
                    <div className="text-muted-foreground">
                      {selected.city}
                      {selected.city && selected.postalCode ? ", " : ""}
                      {selected.postalCode}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.productName}</TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>{formatINR(it.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatINR(it.unitPrice * it.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end text-sm">
                <div className="space-y-1 w-64">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatINR(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{selected.shipping === 0 ? "Free" : formatINR(selected.shipping)}</span>
                  </div>
                  {selected.gst && selected.gst > 0 ? (
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>{formatINR(selected.gst)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Total</span>
                    <span>{formatINR(selected.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Payment</span>
                    <span>{selected.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div>
                  <h3 className="font-semibold mb-1">Customer notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}

              {(() => {
                const split = splitRefundNote(selected.refundNote);
                const trace = hasCaptureTrace(selected.refundNote);
                const canRefund =
                  selected.paymentStatus === "PAID" || (selected.paymentStatus === "UNPAID" && trace);
                const stillActive = selected.status !== "CANCELLED";
                const noteUnchanged = refundAdmin.trim() === split.admin;
                return (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">Payment</h3>
                      <PaymentBadge order={selected} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Method: </span>
                        {selected.paymentMethod === "RAZORPAY" ? "Online (Razorpay)" : "Cash on delivery"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment status: </span>
                        {selected.paymentStatus}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Paid at: </span>
                        {selected.paidAt ? new Date(selected.paidAt).toLocaleString() : "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Razorpay payment ID: </span>
                        {selected.razorpayPaymentId ? (
                          <>
                            <span className="font-mono break-all">{selected.razorpayPaymentId}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label="Copy Razorpay payment ID"
                              onClick={() => copyText(selected.razorpayPaymentId as string)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>

                    {split.system.length > 0 && (
                      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm space-y-1">
                        <div className="font-medium">Automatic payment notes (read-only)</div>
                        {split.system.map((line, i) => (
                          <div key={i} className="flex gap-2">
                            <Badge variant="outline" className="shrink-0">Automatic</Badge>
                            <span className="font-mono text-xs break-all">{line}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="refundNote">Your refund note</Label>
                      <textarea
                        id="refundNote"
                        rows={3}
                        maxLength={900}
                        value={refundAdmin}
                        onChange={(e) => setRefundAdmin(e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="e.g. Refunded in Razorpay on 12 Oct, refund ID rfnd_…"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Internal only. The automatic lines above are kept by the system and cannot be edited.
                      </p>
                    </div>

                    {paymentError && (
                      <p role="alert" className="text-sm text-destructive">
                        {paymentError}
                      </p>
                    )}

                    {confirmingRefund ? (
                      <div role="alertdialog" aria-label="Confirm refund" className="rounded-md border p-3 text-sm space-y-2">
                        <p className="font-medium">
                          Mark this order as refunded? Only do this after you have refunded the customer in Razorpay.
                        </p>
                        {stillActive && (
                          <p className="text-destructive">
                            This order is still active — cancel it too so the stock is released and it is not fulfilled.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" disabled={paymentBusy} onClick={() => submitPayment(true)}>
                            {paymentBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, mark refunded
                          </Button>
                          <Button size="sm" variant="outline" disabled={paymentBusy} onClick={() => setConfirmingRefund(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" disabled={paymentBusy || noteUnchanged} onClick={() => submitPayment(false)}>
                          {paymentBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save note
                        </Button>
                        {canRefund && (
                          <Button
                            variant="destructive"
                            disabled={paymentBusy}
                            onClick={() => {
                              setPaymentError(null);
                              setConfirmingRefund(true);
                            }}
                          >
                            Mark refunded
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Fulfillment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="trackingNumber">Tracking number</Label>
                    <Input
                      id="trackingNumber"
                      value={edit.trackingNumber}
                      onChange={(e) => setEdit((s) => ({ ...s, trackingNumber: e.target.value }))}
                      placeholder="AWB / waybill / consignment ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="courierName">Courier</Label>
                    <Input
                      id="courierName"
                      value={edit.courierName}
                      onChange={(e) => setEdit((s) => ({ ...s, courierName: e.target.value }))}
                      placeholder="Delhivery, Bluedart, Porter…"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label htmlFor="adminNotes">Internal admin notes</Label>
                  <textarea
                    id="adminNotes"
                    rows={3}
                    value={edit.adminNotes}
                    onChange={(e) => setEdit((s) => ({ ...s, adminNotes: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Notes for your fulfillment team — not visible to customers."
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Edit shipping &amp; contact</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="shippingAddress">Address</Label>
                    <textarea
                      id="shippingAddress"
                      rows={2}
                      value={edit.shippingAddress}
                      onChange={(e) => setEdit((s) => ({ ...s, shippingAddress: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={edit.city}
                        onChange={(e) => setEdit((s) => ({ ...s, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">PIN code</Label>
                      <Input
                        id="postalCode"
                        value={edit.postalCode}
                        onChange={(e) => setEdit((s) => ({ ...s, postalCode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Phone</Label>
                      <Input
                        id="customerPhone"
                        value={edit.customerPhone}
                        onChange={(e) => setEdit((s) => ({ ...s, customerPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-end border-t pt-4">
                <Button onClick={handleSaveDetails} disabled={savingDetails}>
                  {savingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save details
                </Button>
              </div>

              <div className="border-t pt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Update status:</span>
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={selected.status === s ? "default" : "outline"}
                    disabled={updatingStatus || selected.status === s}
                    onClick={() => handleStatusChange(selected.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
