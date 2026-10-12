"use client";
import { instagramLink, mailtoLink, telLink, useSettings, whatsappLink } from "@/lib/settings-context";
import { InstagramIcon, WhatsAppIcon } from "./icons";

const link =
  "inline-flex min-h-[36px] items-center gap-2 py-1 text-[15px] text-charcoal transition-colors duration-200 hover:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss";

// Same look as the other footer column headings; `!` beats the unlayered global h1-h6 rule.
const HEADING = "font-sans! text-xs font-medium! uppercase tracking-[0.16em] text-stone-dark";

/** Settings-driven contact details: only fields that are set are shown. Nothing is hardcoded. */
export default function FooterContact() {
  const s = useSettings();
  const tel = telLink(s.phone);
  const mail = mailtoLink(s.email);
  const wa = whatsappLink(s.whatsapp || s.phone);
  const ig = instagramLink(s.instagram);
  const address = s.address.trim();

  // Nothing configured: no empty column.
  if (!tel && !mail && !address && !wa && !ig) return null;

  return (
    <div className="col-span-2 lg:col-span-1">
      <h2 className={HEADING}>Contact</h2>
      <ul className="mt-5 space-y-1">
        {tel && (
          <li>
            <a href={tel} className={link}>
              {s.phone}
            </a>
          </li>
        )}
        {mail && (
          <li>
            <a href={mail} className={link}>
              {s.email}
            </a>
          </li>
        )}
        {address && <li className="max-w-xs py-1 text-[15px] leading-relaxed text-stone-dark">{address}</li>}
        {wa && (
          <li>
            <a href={wa} target="_blank" rel="noopener noreferrer" className={link}>
              <WhatsAppIcon width={20} height={20} />
              WhatsApp
            </a>
          </li>
        )}
        {ig && (
          <li>
            <a href={ig} target="_blank" rel="noopener noreferrer" className={link}>
              <InstagramIcon />
              Instagram
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}
