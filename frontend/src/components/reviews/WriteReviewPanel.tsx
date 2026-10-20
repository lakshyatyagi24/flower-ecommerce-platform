import React from "react";
import type { ApiReview } from "@/lib/api";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { textLink } from "@/components/ui/form-styles";
import { requestSignIn } from "@/lib/sign-in-request";
import ReviewForm from "./ReviewForm";
import { NOT_ELIGIBLE_MESSAGE } from "./review-logic";
import type { ReviewFormState } from "./use-reviews";

type WriteReviewPanelProps = {
  signedIn: boolean;
  checking: boolean;
  canWrite: boolean;
  ownReview: ApiReview | null;
  form: ReviewFormState;
};

function SignInPrompt() {
  return (
    <p className="mt-3 text-base leading-relaxed text-stone-dark">
      {NOT_ELIGIBLE_MESSAGE}{" "}
      <button type="button" className={textLink} onClick={(e) => requestSignIn(e.currentTarget)}>
        Sign in
      </button>{" "}
      to review a product you have received.
    </p>
  );
}

function NotEligible({ ownReview, form }: Pick<WriteReviewPanelProps, "ownReview" | "form">) {
  return (
    <div className="mt-3 space-y-4">
      <p className="text-base leading-relaxed text-stone-dark">{NOT_ELIGIBLE_MESSAGE}</p>
      {form.submitError && <FormError>{form.submitError}</FormError>}
      {ownReview && (
        <Button variant="ghost" onClick={form.handleDelete}>
          Delete your review
        </Button>
      )}
    </div>
  );
}

function PanelBody({ signedIn, checking, canWrite, ownReview, form }: WriteReviewPanelProps) {
  if (!signedIn) return <SignInPrompt />;
  if (checking) return <p className="mt-3 text-base text-stone-dark">Checking…</p>;
  if (!canWrite) return <NotEligible ownReview={ownReview} form={form} />;
  return <ReviewForm form={form} ownReview={ownReview} />;
}

function panelHeading(ownReview: ApiReview | null, canWrite: boolean): string {
  if (!ownReview) return "Write a review";
  return canWrite ? "Edit your review" : "Your review";
}

export default function WriteReviewPanel(props: WriteReviewPanelProps) {
  const { form, ownReview, canWrite } = props;
  return (
    <div>
      <h3 className="type-h3 text-charcoal">{panelHeading(ownReview, canWrite)}</h3>
      {/* Always mounted so screen readers announce the text when it appears. */}
      <p role="status" aria-live="polite" className={form.thanks ? "mt-3 text-base leading-relaxed text-moss" : "sr-only"}>
        {form.thanks}
      </p>
      <PanelBody {...props} />
    </div>
  );
}
