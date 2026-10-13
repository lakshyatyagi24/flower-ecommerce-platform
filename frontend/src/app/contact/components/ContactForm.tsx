"use client";
import EnquiryForm from "@/components/EnquiryForm";

/** Contact-page message form: the shared enquiry form in "contact" mode, tagged with its own source. */
export default function ContactForm() {
  return (
    <EnquiryForm
      mode="contact"
      source="contact-page"
      heading="Send a message"
      description=""
      submitLabel="Send message"
    />
  );
}
