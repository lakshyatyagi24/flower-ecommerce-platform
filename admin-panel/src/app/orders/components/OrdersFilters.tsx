import { Download, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUSES } from "../constants";
import type { OrderFilterState } from "../filters";

type Option = { value: string; label: string };

const STATUS_OPTIONS: Option[] = [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))];

const PAYMENT_STATUS_OPTIONS: Option[] = [
  { value: "", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const PAYMENT_METHOD_OPTIONS: Option[] = [
  { value: "", label: "All" },
  { value: "RAZORPAY", label: "Online" },
  { value: "COD", label: "COD" },
];

const ATTENTION_OPTIONS: Option[] = [
  { value: "", label: "All" },
  { value: "refund", label: "Refunds owed" },
  { value: "mismatch", label: "Check payment" },
  { value: "awaiting", label: "Awaiting payment" },
];

const SORT_OPTIONS: Option[] = [
  { value: "", label: "Newest first" },
  { value: "deliveryDate", label: "Upcoming deliveries (soonest first)" },
];

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block p-2 border rounded text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="min-w-64 flex-1 max-w-md">
      <Label htmlFor="orderSearch">Search orders</Label>
      <div className="relative mt-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id="orderSearch"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Order #, name, email or phone"
          autoComplete="off"
          maxLength={100}
          className="pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

type OrdersFiltersProps = {
  filters: OrderFilterState;
  onFilterChange: (key: keyof OrderFilterState, value: string) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  exporting: boolean;
  onExport: () => void;
};

export function OrdersFilters({ filters, onFilterChange, searchInput, onSearchChange, exporting, onExport }: OrdersFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <SearchBox value={searchInput} onChange={onSearchChange} />
      <FilterSelect id="statusFilter" label="Order status" value={filters.status} options={STATUS_OPTIONS} onChange={(v) => onFilterChange("status", v)} />
      <FilterSelect id="paymentStatusFilter" label="Payment status" value={filters.paymentStatus} options={PAYMENT_STATUS_OPTIONS} onChange={(v) => onFilterChange("paymentStatus", v)} />
      <FilterSelect id="paymentMethodFilter" label="Payment method" value={filters.paymentMethod} options={PAYMENT_METHOD_OPTIONS} onChange={(v) => onFilterChange("paymentMethod", v)} />
      <FilterSelect id="attentionFilter" label="Attention" value={filters.attention} options={ATTENTION_OPTIONS} onChange={(v) => onFilterChange("attention", v)} />
      <FilterSelect
        id="sortBy"
        label="Sort by"
        value={filters.sortBy}
        options={SORT_OPTIONS}
        onChange={(v) => onFilterChange("sortBy", v === "deliveryDate" ? "deliveryDate" : "")}
      />
      <Button type="button" variant="outline" onClick={onExport} disabled={exporting} aria-describedby="export-hint">
        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {exporting ? "Exporting…" : "Export CSV"}
      </Button>
      <span id="export-hint" className="sr-only">Downloads the orders matching the current search and filters, up to 5,000 rows.</span>
    </div>
  );
}
