import React from "react";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { OCCASION_OPTIONS } from "./enquiry-logic";
import type { EnquiryFormState } from "./use-enquiry-form";

type FieldsProps = { state: EnquiryFormState };

export function ContactFields({ state, autoFocusFirst }: FieldsProps & { autoFocusFirst: boolean }) {
  const { form, fid, fieldError, handleChange, blur } = state;
  return (
    <>
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
    </>
  );
}

/** The extra fields of the full (product / corporate) enquiry. */
export function FullOnlyFields({ state }: FieldsProps) {
  const { form, fid, fieldError, handleChange, blur } = state;
  return (
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
          {OCCASION_OPTIONS.map((o) => (
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
  );
}

export function MessageField({ state, contact }: FieldsProps & { contact: boolean }) {
  const { form, fid, fieldError, handleChange, blur } = state;
  return (
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
  );
}
