"use client";
import EnquiryForm from "@/components/EnquiryForm";

/** Contact-page message form: the shared enquiry form in "contact" mode, tagged with its own source. */
export default function ContactForm() {
  return (
    <EnquiryForm
      mode="contact"
      source="contact-page"
      heading="Send a message"
      description="Questions about an order, a custom bouquet or an event? Write to us here."
      submitLabel="Send message"
    />
  );
}
