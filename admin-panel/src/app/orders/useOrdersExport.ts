"use client";

import { useState } from "react";
import { ApiError, CsvDownload, downloadOrdersCsv } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { filtersToQuery, OrderFilterState } from "./filters";

function exportSuccessToast(res: CsvDownload) {
  if (res.truncated) {
    return {
      type: "warning" as const,
      title: "Export is partial",
      description: `Exported the first ${res.rows ?? ""} of ${res.total ?? "many"} orders. Narrow the filters to export the rest.`,
    };
  }
  return { type: "success" as const, title: "Export ready", description: `${res.rows ?? 0} orders saved as ${res.filename}.` };
}

// Downloads exactly what the list is filtered to (same filters, no paging), capped by the server.
export function useOrdersExport(
  filters: OrderFilterState,
  searchInput: string,
  setSearchInput: (value: string) => void,
) {
  const [exporting, setExporting] = useState(false);
  const { addToast } = useToast();

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    const q = searchInput.trim();
    setSearchInput(q); // the list and the file now agree even if the pause had not elapsed
    try {
      addToast(exportSuccessToast(await downloadOrdersCsv(filtersToQuery(filters, q))));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return; // announced by the auth provider
      const description = err instanceof Error ? err.message : "Could not export orders.";
      addToast({ type: "error", title: "Export failed", description });
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportCsv };
}
