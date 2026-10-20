"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ENQUIRY_FIELD_ORDER, validateEnquiry, type EnquiryFieldName } from "@/lib/enquiry-validation";
import { blankValues, buildEnquiryPayload, enquiryErrorMessage, type EnquiryContext } from "./enquiry-logic";

type Options = EnquiryContext & { occasion?: string; onSuccess?: () => void };
type Status = "idle" | "sending" | "sent" | "error";
type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/** Form values, inline validation (shown once blurred or after a submit attempt) and the submit flow. */
export function useEnquiryForm({ contact, source, productId, productName, occasion, onSuccess }: Options) {
  const uid = useId();
  const [form, setForm] = useState(() => blankValues(occasion));
  const [touched, setTouched] = useState<Partial<Record<EnquiryFieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const fid = (name: string) => `${uid}-${name}`;
  const errors = validateEnquiry(form, { messageRequired: contact });
  const fieldError = (k: EnquiryFieldName) => (touched[k] || attempted ? errors[k] : undefined);
  const summaryItems = attempted
    ? ENQUIRY_FIELD_ORDER.filter((k) => errors[k]).map((k) => ({ id: fid(k), message: errors[k] as string }))
    : [];

  useEffect(() => {
    if (focusTick > 0) summaryRef.current?.focus();
  }, [focusTick]);

  // Keep focus inside the form area (and the modal) when the form is replaced by the success panel.
  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  const handleChange = (e: ChangeEvent) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };
  const blur = (k: EnquiryFieldName) => () => setTouched((t) => ({ ...t, [k]: true }));

  const send = async () => {
    await api.createEnquiry(buildEnquiryPayload(form, { contact, source, productId, productName }));
    setStatus("sent");
    setForm(blankValues(occasion));
    setTouched({});
    setAttempted(false);
    onSuccess?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return;
    setAttempted(true);
    setServerError(null);
    if (Object.keys(errors).length > 0) {
      setStatus("idle");
      setFocusTick((t) => t + 1);
      return;
    }
    sendingRef.current = true;
    setStatus("sending");
    try {
      await send();
    } catch (err) {
      setServerError(enquiryErrorMessage(err));
      setStatus("error");
      setFocusTick((t) => t + 1);
    } finally {
      sendingRef.current = false;
    }
  };

  return {
    form,
    fid,
    fieldError,
    summaryItems,
    summaryRef,
    sentRef,
    status,
    serverError,
    handleChange,
    blur,
    handleSubmit,
    sendAnother: () => setStatus("idle"),
  };
}

export type EnquiryFormState = ReturnType<typeof useEnquiryForm>;
