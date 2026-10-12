"use client";
import { instagramLink, mailtoLink, telLink, useSettings, whatsappLink } from "@/lib/settings-context";
import { InstagramIcon, WhatsAppIcon } from "./icons";

const link =
  "inline-flex min-h-[36px] items-center gap-2 py-1 text-[15px] text-charcoal transition-colors duration-200 hover:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss";

/** Settings-driven contact details: only fields that are set are shown. Nothing is hardcoded. */
export default function FooterContact() {
  const s = useSettings();
  const tel = telLink(s.phone);
  const mail = mailtoLink(s.email);
  const wa = whatsappLink(s.whatsapp || s.phone);
  const ig = instagramLink(s.instagram);
  const address = s.address.trim();

  return (
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
  );
}
