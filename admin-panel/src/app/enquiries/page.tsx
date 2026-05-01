"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminApi, AdminEnquiry, AdminEnquiryStatus, ApiError } from "@/lib/api";

const STATUSES: AdminEnquiryStatus[] = ["NEW", "CONTACTED", "QUOTED", "CONVERTED", "CLOSED"];

function statusVariant(status: AdminEnquiryStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "NEW":
      return "destructive";
    case "CONTACTED":
      return "outline";
    case "QUOTED":
      return "secondary";
    case "CONVERTED":
      return "default";
    case "CLOSED":
      return "outline";
  }
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function fmtDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function whatsappUrl(phone: string, customerName: string) {
  const digits = phone.replace(/\D+/g, "");
  if (digits.length < 8) return null;
  const text = `Hi ${customerName}, this is the team at Fresh Petals India. We received your enquiry — `;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<AdminEnquiry | null>(null);
  const [adminNotesDraft, setAdminNotesDraft] = useState("");
  const [updating, setUpdating] = useState(false);
  const { addToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listEnquiries({ status: statusFilter || undefined, take: 200 });
      setEnquiries(res.items);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load enquiries";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    setAdminNotesDraft(selected?.adminNotes ?? "");
  }, [selected]);

  const handleStatusChange = async (status: AdminEnquiryStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateEnquiryStatus(selected.id, status, adminNotesDraft);
      setSelected(updated);
      addToast({
        type: "success",
        title: "Enquiry updated",
        description: `Enquiry #${selected.id} is now ${status}.`,
      });
      fetchAll();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateEnquiryStatus(selected.id, selected.status, adminNotesDraft);
      setSelected(updated);
      addToast({ type: "success", title: "Notes saved", description: `Saved on enquiry #${selected.id}.` });
      fetchAll();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save notes";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-7 w-7" /> Enquiries
          </h1>
          <p className="text-muted-foreground mt-1">Bouquets, arrangements, hampers and contact-form requests.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("")}
            >
              All
            </Button>
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{loading ? "Loading…" : `${enquiries.length} enquiries`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : enquiries.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No enquiries match this filter yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Product / Source</TableHead>
                    <TableHead>Event date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enquiries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">#{e.id}</TableCell>
                      <TableCell>{e.customerName}</TableCell>
                      <TableCell className="font-mono text-xs">{e.customerPhone}</TableCell>
                      <TableCell>
                        <div className="text-sm">{e.productName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{e.source}</div>
                      </TableCell>
                      <TableCell>{fmtDate(e.eventDate)}</TableCell>
                      <TableCell>{e.quantity ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(e)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Enquiry #{selected.id} · {selected.customerName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                    <p className="font-medium">{selected.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="font-medium">{selected.customerEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Product / source</p>
                    <p className="font-medium">{selected.productName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{selected.source}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</p>
                    <p className="font-medium">{selected.quantity ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Event date</p>
                    <p className="font-medium">{fmtDate(selected.eventDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Occasion</p>
                    <p className="font-medium">{selected.occasion || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                    <p className="font-medium">{selected.budget ? `₹${selected.budget}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">City</p>
                    <p className="font-medium">{selected.city || "—"}</p>
                  </div>
                </div>

                {selected.address && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                    <p className="text-sm whitespace-pre-wrap">{selected.address}</p>
                  </div>
                )}

                {selected.message && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer message</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">{selected.message}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="admin-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Internal notes
                  </label>
                  <textarea
                    id="admin-notes"
                    rows={3}
                    value={adminNotesDraft}
                    onChange={(e) => setAdminNotesDraft(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Quoted ₹X, customer to confirm by Friday, etc."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={handleSaveNotes}
                    disabled={updating}
                  >
                    Save notes
                  </Button>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mark as</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selected.status === s ? "default" : "outline"}
                        disabled={updating || selected.status === s}
                        onClick={() => handleStatusChange(s)}
                      >
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  <a
                    href={`tel:${selected.customerPhone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
                  >
                    Call
                  </a>
                  {whatsappUrl(selected.customerPhone, selected.customerName) && (
                    <a
                      href={whatsappUrl(selected.customerPhone, selected.customerName)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
                    >
                      WhatsApp <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  )}
                  {selected.customerEmail && (
                    <a
                      href={`mailto:${selected.customerEmail}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
