"use client";

import React from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { ContactFields, FullOnlyFields, MessageField } from "./enquiry/EnquiryFields";
import { useEnquiryForm, type EnquiryFormState } from "./enquiry/use-enquiry-form";

export type EnquiryFormDefaults = {
  productId?: number | null;
  productName?: string;
  source?: string;
  occasion?: string;
};

export type EnquiryFormProps = EnquiryFormDefaults & {
  /** "full" (corporate / product enquiries) or "contact" (name, phone, email, message). */
  mode?: "full" | "contact";
  /** "inline" tightens the spacing under the heading (used inside the modal). Both are flat, no card. */
  variant?: "card" | "inline";
  heading?: string;
  description?: string;
  submitLabel?: string;
  /** Focus the first field on mount (used inside the modal). */
  autoFocusFirst?: boolean;
  onSuccess?: () => void;
};

const focusField = (id: string) => document.getElementById(id)?.focus();

function EnquiryIntro({ heading, description, productName }: Pick<EnquiryFormProps, "heading" | "description" | "productName">) {
  return (
    <>
      {heading ? <h2 className="type-h3 text-charcoal">{heading}</h2> : null}
      {description ? (
        <p className={`${heading ? "mt-3" : ""} text-base leading-relaxed text-stone-dark`}>{description}</p>
      ) : null}
      {productName ? (
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">
          Enquiring about: <span className="text-charcoal">{productName}</span>
        </p>
      ) : null}
    </>
  );
}

function SentPanel({ state, contact, gap }: { state: EnquiryFormState; contact: boolean; gap: string }) {
  const noun = contact ? "message" : "enquiry";
  return (
    <div role="status" ref={state.sentRef} tabIndex={-1} className={`border border-stone-light bg-ivory-deep p-6 ${gap}`}>
      <p className="font-display text-2xl text-charcoal">Thank you</p>
      <p className="mt-2 text-base leading-relaxed text-stone-dark">
        We&apos;ve received your {noun} and will be in touch to confirm the details.
      </p>
      <div className="mt-5">
        <Button variant="ghost" onClick={state.sendAnother}>
          Send another {noun}
        </Button>
      </div>
    </div>
  );
}

function ErrorSummary({ state }: { state: EnquiryFormState }) {
  const { summaryItems, serverError } = state;
  if (summaryItems.length === 0 && !serverError) return null;
  return (
    <div className="sm:col-span-2">
      <FormError
        ref={state.summaryRef}
        title={summaryItems.length > 0 ? "Please check the highlighted fields" : "We couldn't send your enquiry"}
        items={summaryItems}
        onItemClick={focusField}
      >
        {serverError}
      </FormError>
    </div>
  );
}

type EntryFormProps = { state: EnquiryFormState; contact: boolean; gap: string; submitLabel: string; autoFocusFirst: boolean };

function EntryForm({ state, contact, gap, submitLabel, autoFocusFirst }: EntryFormProps) {
  const sending = state.status === "sending";
  return (
    <form onSubmit={state.handleSubmit} noValidate className={`grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 ${gap}`}>
      <ErrorSummary state={state} />
      <ContactFields state={state} autoFocusFirst={autoFocusFirst} />
      {!contact && <FullOnlyFields state={state} />}
      <MessageField state={state} contact={contact} />
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
          {sending ? "Sending…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function EnquiryForm({
  productId = null,
  productName,
  source = "website",
  occasion,
  mode = "full",
  variant = "card",
  heading = "Send an enquiry",
  description = "Share your requirement and we will get back to you to confirm pricing and availability.",
  submitLabel = "Send enquiry",
  autoFocusFirst = false,
  onSuccess,
}: EnquiryFormProps) {
  const contact = mode === "contact";
  const state = useEnquiryForm({ contact, source, productId, productName, occasion, onSuccess });
  const gap = variant === "inline" ? "mt-5" : "mt-8";
  return (
    <div>
      <EnquiryIntro heading={heading} description={description} productName={productName} />
      {state.status === "sent" ? (
        <SentPanel state={state} contact={contact} gap={gap} />
      ) : (
        <EntryForm state={state} contact={contact} gap={gap} submitLabel={submitLabel} autoFocusFirst={autoFocusFirst} />
      )}
    </div>
  );
}
