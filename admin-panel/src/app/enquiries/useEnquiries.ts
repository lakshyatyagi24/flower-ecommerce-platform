"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, AdminEnquiry, AdminEnquiryStatus } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/error-message";

type UpdateMessages = { failure: string; title: string; description: string };

export function useEnquiries() {
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
      addToast({ type: "error", title: "Error", description: errorMessage(err, "Failed to load enquiries") });
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

  const saveStatusAndNotes = async (status: AdminEnquiryStatus, messages: UpdateMessages) => {
    if (!selected) return;
    setUpdating(true);
    try {
      setSelected(await adminApi.updateEnquiryStatus(selected.id, status, adminNotesDraft));
      addToast({ type: "success", title: messages.title, description: messages.description });
      fetchAll();
    } catch (err) {
      addToast({ type: "error", title: "Error", description: errorMessage(err, messages.failure) });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (status: AdminEnquiryStatus) =>
    saveStatusAndNotes(status, {
      failure: "Failed to update",
      title: "Enquiry updated",
      description: `Enquiry #${selected?.id} is now ${status}.`,
    });

  const handleSaveNotes = () =>
    selected &&
    saveStatusAndNotes(selected.status, {
      failure: "Failed to save notes",
      title: "Notes saved",
      description: `Saved on enquiry #${selected.id}.`,
    });

  return {
    enquiries,
    loading,
    statusFilter,
    setStatusFilter,
    selected,
    setSelected,
    adminNotesDraft,
    setAdminNotesDraft,
    updating,
    handleStatusChange,
    handleSaveNotes,
  };
}

export type EnquiriesState = ReturnType<typeof useEnquiries>;
