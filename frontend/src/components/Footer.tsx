import Link from "next/link";
import Container from "@/components/ui/Container";
import FooterContact from "@/components/chrome/FooterContact";
import { OCCASIONS } from "@/lib/occasions";

// Server component: every link list is static markup, so it is in the server HTML (R15). Only the
// contact details (settings-driven) are a client island.
const linkClass =
  "inline-block py-1.5 text-[15px] text-charcoal transition-colors duration-200 hover:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss";
const headingClass = "font-sans text-xs font-medium uppercase tracking-[0.16em] text-stone-dark";

const HELP = [
  { href: "/track-order", label: "Track order" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/refund-policy", label: "Refund policy" },
];
const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

function Column({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h2 className={headingClass}>{title}</h2>
      {children}
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-stone-light bg-ivory">
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-10">
          <Column title="Shop" className="col-span-2 lg:col-span-1">
            <ul className="mt-5 columns-2 gap-x-6 lg:columns-1">
              <li>
                <Link href="/products" className={linkClass}>
                  All flowers
                </Link>
              </li>
              {OCCASIONS.map((o) => (
                <li key={o.slug}>
                  <Link href={`/occasions/${o.slug}`} className={linkClass}>
                    {o.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/corporate" className={linkClass}>
                  Corporate
                </Link>
              </li>
            </ul>
          </Column>

          <Column title="Help">
            <ul className="mt-5">
              {HELP.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Company">
            <ul className="mt-5">
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Contact" className="col-span-2 lg:col-span-1">
            <FooterContact />
          </Column>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-stone-light pt-6 text-[13px] text-stone-dark sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Fresh Petals India</p>
          <p className="font-display text-lg text-charcoal">Fresh Petals</p>
        </div>
      </Container>
    </footer>
  );
}
