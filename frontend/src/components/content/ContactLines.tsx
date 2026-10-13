"use client";
import Link from "next/link";
import { useSettings } from "@/lib/settings-context";
import { contactChannels } from "@/lib/contact-channels";

/**
 * Store contact details for legal pages, from settings. Blank or placeholder settings are omitted; with
 * nothing configured it points at the contact page instead of showing a fake value.
 */
export default function ContactLines({ withName = true }: { withName?: boolean }) {
  const settings = useSettings();
  const channels = contactChannels(settings).filter((c) => c.key !== "whatsapp");
  return (
    <p>
      {withName ? <>{settings.name}<br /></> : null}
      {channels.map((c) => (
        <span key={c.key}>
          {c.key === "address" ? (
            c.text
          ) : (
            <>
              {c.label}: <a href={c.href}>{c.text}</a>
            </>
          )}
          <br />
        </span>
      ))}
      {channels.length === 0 ? (
        <>
          You can reach us through our <Link href="/contact">contact page</Link>.
        </>
      ) : null}
    </p>
  );
}
