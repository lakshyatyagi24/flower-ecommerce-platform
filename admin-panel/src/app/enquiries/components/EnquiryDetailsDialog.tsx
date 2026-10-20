import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminEnquiry } from "@/lib/api";
import { fmtDate, statusLabel, STATUSES, telNumber, whatsappUrl } from "../format";
import type { EnquiriesState } from "../useEnquiries";

const LABEL_CLASS = "text-xs uppercase tracking-wide text-muted-foreground";
const LINK_CLASS = "inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted";

function Detail({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div>
      <p className={LABEL_CLASS}>{label}</p>
      <p className="font-medium">{children}</p>
      {note !== undefined && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function DetailsGrid({ e }: { e: AdminEnquiry }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <Detail label="Phone">{e.customerPhone}</Detail>
      <Detail label="Email">{e.customerEmail || "—"}</Detail>
      <Detail label="Product / source" note={e.source}>{e.productName || "—"}</Detail>
      <Detail label="Quantity">{e.quantity ?? "—"}</Detail>
      <Detail label="Event date">{fmtDate(e.eventDate)}</Detail>
      <Detail label="Occasion">{e.occasion || "—"}</Detail>
      <Detail label="Budget">{e.budget ? `₹${e.budget}` : "—"}</Detail>
      <Detail label="City">{e.city || "—"}</Detail>
    </div>
  );
}

function TextBlock({ label, text, className }: { label: string; text: string | null; className: string }) {
  if (!text) return null;
  return (
    <div>
      <p className={LABEL_CLASS}>{label}</p>
      <p className={className}>{text}</p>
    </div>
  );
}

function NotesEditor({ state }: { state: EnquiriesState }) {
  return (
    <div>
      <label htmlFor="admin-notes" className={LABEL_CLASS}>
        Internal notes
      </label>
      <textarea
        id="admin-notes"
        rows={3}
        value={state.adminNotesDraft}
        onChange={(e) => state.setAdminNotesDraft(e.target.value)}
        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Quoted ₹X, customer to confirm by Friday, etc."
      />
      <Button size="sm" variant="outline" className="mt-2" onClick={state.handleSaveNotes} disabled={state.updating}>
        Save notes
      </Button>
    </div>
  );
}

function StatusButtons({ enquiry, state }: { enquiry: AdminEnquiry; state: EnquiriesState }) {
  return (
    <div>
      <p className={`${LABEL_CLASS} mb-2`}>Mark as</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={enquiry.status === s ? "default" : "outline"}
            disabled={state.updating || enquiry.status === s}
            onClick={() => state.handleStatusChange(s)}
          >
            {statusLabel(s)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ContactLinks({ enquiry }: { enquiry: AdminEnquiry }) {
  const whatsapp = whatsappUrl(enquiry.customerPhone, enquiry.customerName);
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t">
      <a href={`tel:${telNumber(enquiry.customerPhone)}`} className={LINK_CLASS}>
        Call
      </a>
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          WhatsApp <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      )}
      {enquiry.customerEmail && (
        <a href={`mailto:${enquiry.customerEmail}`} className={LINK_CLASS}>
          Email
        </a>
      )}
    </div>
  );
}

function EnquiryBody({ enquiry, state }: { enquiry: AdminEnquiry; state: EnquiriesState }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Enquiry #{enquiry.id} · {enquiry.customerName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <DetailsGrid e={enquiry} />
        <TextBlock label="Address" text={enquiry.address} className="text-sm whitespace-pre-wrap" />
        <TextBlock label="Customer message" text={enquiry.message} className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3" />
        <NotesEditor state={state} />
        <StatusButtons enquiry={enquiry} state={state} />
        <ContactLinks enquiry={enquiry} />
      </div>
    </>
  );
}

export function EnquiryDetailsDialog({ state }: { state: EnquiriesState }) {
  const { selected, setSelected } = state;
  return (
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {selected && <EnquiryBody enquiry={selected} state={state} />}
      </DialogContent>
    </Dialog>
  );
}
