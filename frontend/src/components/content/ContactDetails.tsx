"use client";
import { useSettings } from "@/lib/settings-context";
import { businessHours, contactChannels, deliverySummary } from "@/lib/contact-channels";
import { textLink } from "@/components/ui/form-styles";

/**
 * Contact rows driven entirely by settings. A row appears only when its setting holds a real value (blank or
 * seed-placeholder values are hidden, never replaced by filler text or hardcoded hours or delivery copy).
 */
export default function ContactDetails() {
  const settings = useSettings();
  const channels = contactChannels(settings);
  const hours = businessHours(settings);
  const delivery = deliverySummary(settings);
  if (channels.length === 0 && !hours && !delivery) return null;

  const row = "grid gap-1 border-b border-stone-light py-5 sm:grid-cols-[8rem_1fr] sm:gap-6";
  const label = "text-xs font-medium uppercase tracking-[0.16em] text-stone-dark";
  return (
    <dl className="border-t border-stone-light" aria-label="Contact details">
      {channels.map((c) => (
        <div key={c.key} className={row}>
          <dt className={label}>{c.label}</dt>
          <dd className="text-base text-charcoal">
            <a
              href={c.href}
              className={`inline-flex min-h-6 items-center ${textLink}`}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {c.text}
            </a>
          </dd>
        </div>
      ))}
      {hours ? (
        <div className={row}>
          <dt className={label}>Hours</dt>
          <dd className="whitespace-pre-line text-base text-charcoal">{hours}</dd>
        </div>
      ) : null}
      {delivery ? (
        <div className={row}>
          <dt className={label}>Delivery</dt>
          <dd className="text-base leading-relaxed text-charcoal">{delivery}</dd>
        </div>
      ) : null}
    </dl>
  );
}
