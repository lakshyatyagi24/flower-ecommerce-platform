"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ENQUIRY_FIELD_ORDER, validateEnquiry, type EnquiryFieldName } from "@/lib/enquiry-validation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

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

const occasionOptions = ["Corporate / Office", "Wedding", "Anniversary", "Birthday", "Conference / Event", "Other"];

export default function EnquiryForm({
  productId = null,
  productName,
  source = "website",
  occasion: defaultOccasion,
  mode = "full",
  variant = "card",
  heading = "Send an enquiry",
  description = "Share your requirement and we will get back to you to confirm pricing and availability.",
  submitLabel = "Send enquiry",
  autoFocusFirst = false,
  onSuccess,
}: EnquiryFormProps) {
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const contact = mode === "contact";

  const blank = {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    quantity: "",
    eventDate: "",
    occasion: defaultOccasion || "",
    address: "",
    city: "",
    message: "",
  };
  const [form, setForm] = useState(blank);
  const [touched, setTouched] = useState<Partial<Record<EnquiryFieldName, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const sentRef = useRef<HTMLDivElement>(null);

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }
  const blur = (k: EnquiryFieldName) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function handleSubmit(e: React.FormEvent) {
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
      if (contact) {
        await api.createEnquiry({
          customerName: form.customerName,
          customerEmail: form.customerEmail || undefined,
          customerPhone: form.customerPhone,
          message: form.message,
          source,
        });
      } else {
        await api.createEnquiry({
          productId: productId ?? undefined,
          productName,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || undefined,
          quantity: form.quantity ? Number(form.quantity) : undefined,
          eventDate: form.eventDate || undefined,
          occasion: form.occasion || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          message: form.message || undefined,
          source,
        });
      }
      setStatus("sent");
      setForm(blank);
      setTouched({});
      setAttempted(false);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not send your enquiry";
      setServerError(msg);
      setStatus("error");
      setFocusTick((t) => t + 1);
    } finally {
      sendingRef.current = false;
    }
  }

  const focusField = (id: string) => document.getElementById(id)?.focus();
  const sending = status === "sending";
  const gap = variant === "inline" ? "mt-5" : "mt-8";

  return (
    <div>
      {heading ? <h2 className="type-h3 text-charcoal">{heading}</h2> : null}
      {description ? (
        <p className={`${heading ? "mt-3" : ""} text-base leading-relaxed text-stone-dark`}>{description}</p>
      ) : null}
      {productName ? (
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">
          Enquiring about: <span className="text-charcoal">{productName}</span>
        </p>
      ) : null}

      {status === "sent" ? (
        <div role="status" ref={sentRef} tabIndex={-1} className={`border border-stone-light bg-ivory-deep p-6 ${gap}`}>
          <p className="font-display text-2xl text-charcoal">Thank you</p>
          <p className="mt-2 text-base leading-relaxed text-stone-dark">
            We&apos;ve received your {contact ? "message" : "enquiry"} and will be in touch to confirm the details.
          </p>
          <div className="mt-5">
            <Button variant="ghost" onClick={() => setStatus("idle")}>
              Send another {contact ? "message" : "enquiry"}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={`grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 ${gap}`}>
          {(summaryItems.length > 0 || serverError) && (
            <div className="sm:col-span-2">
              <FormError
                ref={summaryRef}
                title={summaryItems.length > 0 ? "Please check the highlighted fields" : "We couldn't send your enquiry"}
                items={summaryItems}
                onItemClick={focusField}
              >
                {serverError}
              </FormError>
            </div>
          )}

          <Field id={fid("customerName")} label="Your name" error={fieldError("customerName")}>
            <Input
              name="customerName"
              autoComplete="name"
              maxLength={80}
              value={form.customerName}
              onChange={handleChange}
              onBlur={blur("customerName")}
              data-autofocus={autoFocusFirst ? "" : undefined}
            />
          </Field>
          <Field id={fid("customerPhone")} label="Phone" error={fieldError("customerPhone")}>
            <Input
              name="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.customerPhone}
              onChange={handleChange}
              onBlur={blur("customerPhone")}
            />
          </Field>
          <Field id={fid("customerEmail")} label="Email" optional error={fieldError("customerEmail")} className="sm:col-span-2">
            <Input
              name="customerEmail"
              type="email"
              autoComplete="email"
              value={form.customerEmail}
              onChange={handleChange}
              onBlur={blur("customerEmail")}
            />
          </Field>

          {!contact && (
            <>
              <Field id={fid("quantity")} label="Quantity or size" optional hint="Number of stems or bouquets" error={fieldError("quantity")}>
                <Input
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.quantity}
                  onChange={handleChange}
                  onBlur={blur("quantity")}
                />
              </Field>
              <Field id={fid("eventDate")} label="Delivery or event date" optional>
                <Input name="eventDate" type="date" value={form.eventDate} onChange={handleChange} />
              </Field>
              <Field id={fid("occasion")} label="Occasion" optional>
                <Select name="occasion" value={form.occasion} onChange={handleChange}>
                  <option value="">Select</option>
                  {occasionOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id={fid("city")} label="City" optional>
                <Input name="city" maxLength={80} autoComplete="address-level2" placeholder="Delhi NCR" value={form.city} onChange={handleChange} />
              </Field>
              <Field id={fid("address")} label="Delivery address" optional className="sm:col-span-2">
                <Textarea name="address" rows={2} maxLength={500} autoComplete="street-address" value={form.address} onChange={handleChange} />
              </Field>
            </>
          )}

          <Field
            id={fid("message")}
            label={contact ? "Message" : "Additional details"}
            optional={!contact}
            error={fieldError("message")}
            className="sm:col-span-2"
          >
            <Textarea
              name="message"
              rows={contact ? 5 : 3}
              maxLength={2000}
              placeholder={
                contact
                  ? "Tell us what you are looking for: flowers, quantity, event date and so on."
                  : "Colour preferences, budget, special requirements and so on."
              }
              value={form.message}
              onChange={handleChange}
              onBlur={blur("message")}
            />
          </Field>

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
              {sending ? "Sending…" : submitLabel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
