import React from "react";
import type { ApiReview } from "@/lib/api";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { StarPicker } from "./stars";
import { BODY_MAX, BODY_MIN, TITLE_MAX } from "./review-logic";
import type { ReviewFormState } from "./use-reviews";

type ReviewFormProps = { form: ReviewFormState; ownReview: ApiReview | null };

function FormActions({ form, ownReview }: ReviewFormProps) {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Button type="submit" disabled={form.submitting}>
        {form.submitting ? "Saving…" : ownReview ? "Update review" : "Submit review"}
      </Button>
      {ownReview && (
        <Button variant="ghost" onClick={form.handleDelete}>
          Delete
        </Button>
      )}
    </div>
  );
}

export default function ReviewForm({ form, ownReview }: ReviewFormProps) {
  return (
    <form onSubmit={form.handleSubmit} noValidate className="mt-6 space-y-6">
      {ownReview?.status === "APPROVED" && (
        <p className="text-sm leading-relaxed text-stone-dark">
          Editing your review sends it for a quick check again before it reappears.
        </p>
      )}
      {form.submitError && <FormError>{form.submitError}</FormError>}
      <fieldset>
        <legend className="mb-1 block text-sm text-charcoal">Your rating</legend>
        <StarPicker value={form.values.rating} onChange={form.setRating} />
      </fieldset>
      <Field label="Title" optional>
        <Input
          type="text"
          value={form.values.title}
          onChange={(e) => form.setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="Loved the colours"
        />
      </Field>
      <Field label="Your review" error={form.bodyError} hint={`${BODY_MIN} to ${BODY_MAX} characters`}>
        <Textarea
          value={form.values.body}
          onChange={(e) => form.setBody(e.target.value)}
          maxLength={BODY_MAX}
          rows={4}
          placeholder="Share what you liked"
        />
      </Field>
      <FormActions form={form} ownReview={ownReview} />
    </form>
  );
}
