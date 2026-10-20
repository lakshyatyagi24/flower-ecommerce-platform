import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUSES } from "../constants";
import type { EditState } from "../edit-state";
import { Button } from "@/components/ui/button";

type OnField = (key: keyof EditState, value: string) => void;

const TEXTAREA_CLASS =
  "mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type FieldProps = { field: keyof EditState; label: string; edit: EditState; onField: OnField; placeholder?: string };

function EditInput({ field, label, edit, onField, placeholder }: FieldProps) {
  return (
    <div>
      <Label htmlFor={field}>{label}</Label>
      <Input id={field} value={edit[field]} onChange={(e) => onField(field, e.target.value)} placeholder={placeholder} />
    </div>
  );
}

type AreaProps = FieldProps & { rows: number };

function EditTextarea({ field, label, edit, onField, placeholder, rows }: AreaProps) {
  return (
    <div>
      <Label htmlFor={field}>{label}</Label>
      <textarea
        id={field}
        rows={rows}
        value={edit[field]}
        onChange={(e) => onField(field, e.target.value)}
        className={TEXTAREA_CLASS}
        placeholder={placeholder}
      />
    </div>
  );
}

export function FulfillmentSection({ edit, onField }: { edit: EditState; onField: OnField }) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-3">Fulfillment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EditInput field="trackingNumber" label="Tracking number" edit={edit} onField={onField} placeholder="AWB / waybill / consignment ID" />
        <EditInput field="courierName" label="Courier" edit={edit} onField={onField} placeholder="Delhivery, Bluedart, Porter…" />
      </div>
      <div className="mt-3">
        <EditTextarea
          field="adminNotes"
          label="Internal admin notes"
          rows={3}
          edit={edit}
          onField={onField}
          placeholder="Notes for your fulfillment team — not visible to customers."
        />
      </div>
    </div>
  );
}

export function ShippingEditSection({ edit, onField }: { edit: EditState; onField: OnField }) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-3">Edit shipping &amp; contact</h3>
      <div className="space-y-3">
        <EditTextarea field="shippingAddress" label="Address" rows={2} edit={edit} onField={onField} />
        <div className="grid grid-cols-3 gap-3">
          <EditInput field="city" label="City" edit={edit} onField={onField} />
          <EditInput field="postalCode" label="PIN code" edit={edit} onField={onField} />
          <EditInput field="customerPhone" label="Phone" edit={edit} onField={onField} />
        </div>
      </div>
    </div>
  );
}

type StatusButtonsProps = {
  current: string;
  disabled: boolean;
  onChange: (status: string) => void;
};

export function StatusButtons({ current, disabled, onChange }: StatusButtonsProps) {
  return (
    <div className="border-t pt-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Update status:</span>
      {STATUSES.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={current === s ? "default" : "outline"}
          disabled={disabled || current === s}
          onClick={() => onChange(s)}
        >
          {s}
        </Button>
      ))}
    </div>
  );
}
