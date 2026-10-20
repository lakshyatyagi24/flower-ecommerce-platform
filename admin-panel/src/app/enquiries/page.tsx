"use client";

import { MessageSquare } from "lucide-react";
import { EnquiriesCard } from "./components/EnquiriesCard";
import { EnquiryDetailsDialog } from "./components/EnquiryDetailsDialog";
import { EnquiryFilters } from "./components/EnquiryFilters";
import { useEnquiries } from "./useEnquiries";

export default function EnquiriesPage() {
  const state = useEnquiries();

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

      <EnquiryFilters value={state.statusFilter} onChange={state.setStatusFilter} />
      <EnquiriesCard enquiries={state.enquiries} loading={state.loading} onView={state.setSelected} />
      <EnquiryDetailsDialog state={state} />
    </div>
  );
}
