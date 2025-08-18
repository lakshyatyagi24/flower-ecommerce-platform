import React from "react";
import Image from "next/image";
import Link from "next/link";
import OrderTimeline from "@/components/OrderTimeline";
import p1 from "@/assets/test1.png";
import p2 from "@/assets/test2.png";

// allow loose props shape to satisfy Next's PageProps during build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function TrackOrderResults(props: any) {
  // searchParams can be a Promise in certain Next internals — await it before use
  const rawSearchParams = await props?.searchParams;
  const searchParams = rawSearchParams as Record<string, string | string[] | undefined> | undefined;
  const orderId = typeof searchParams?.orderId === "string" ? searchParams.orderId : "";
  const contact = typeof searchParams?.contact === "string" ? searchParams.contact : "";

  if (!orderId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-2">Order status</h2>
          <p className="text-sm text-red-600">No Order ID provided. Please go back and enter your Order ID.</p>
        </div>
      </main>
    );
  }

  // -- Mock order data (replace with API integration) --
  const now = new Date();
  const placedAt = new Date(now.getTime() - 1000 * 60 * 60 * 5); // placed 5 hours ago
  const preparingAt = new Date(placedAt.getTime() + 1000 * 60 * 60 * 1); // after 1 hour
  const outForDeliveryAt = new Date(now.getTime() - 1000 * 60 * 30); // 30 minutes ago
  const deliveredAt = null; // not delivered yet

  const order = {
    id: orderId,
    date: placedAt,
    summary: "Rustic seasonal bouquet x1",
    recipient: "Asha Verma",
    address: "12 Rose Lane, New Delhi, DL 110001",
    estimatedDelivery: new Date(now.getTime() + 1000 * 60 * 60 * 1.5), // 1.5 hours from now
    paymentStatus: "Paid",
    paymentMethod: "UPI •••• 1234",
    items: [
      { id: "p1", name: "Rustic Seasonal Bouquet", qty: 1, price: 999, image: p1 },
      { id: "p2", name: "Add-on: Chocolate Box", qty: 1, price: 299, image: p2 },
    ],
  };

  const phases = [
    { key: "placed", label: "Order Placed", time: placedAt },
    { key: "preparing", label: "Preparing", time: preparingAt },
    { key: "out", label: "Out for Delivery", time: outForDeliveryAt },
    { key: "delivered", label: "Delivered", time: deliveredAt },
  ];

  // determine current index
  const currentIndex = phases.reduce((idx, p, i) => (p.time ? i : idx), 0);

  function fmt(d?: Date | null) {
    if (!d) return "—";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 rustic-vignette">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Order #{order.id}</h2>
            <div className="text-sm text-slate-600">Placed {order.date.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Estimated delivery</div>
            <div className="text-lg font-medium text-olive-green">{order.estimatedDelivery.toLocaleString()}</div>
          </div>
        </header>

        {/* Personalized touch: thank you note + small motif */}
        <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-md">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 leaf-motif" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M6 30c6-8 18-12 24-6s6 18-6 24c0 0-6-6-18-18z" fill="#7C835A" opacity="0.12" />
              <path d="M34 8c-4 6-10 10-14 8s-6-8-2-14c0 0 6 2 16 6z" fill="#B79B7A" opacity="0.16" />
              <path d="M22 20c2 0 6-2 8-6" stroke="#7C835A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">We’re crafting your flowers with care!</div>
            <div className="text-xs text-slate-600">Small artisanal touches are added to every bouquet. We&apos;ll notify you with delivery updates.</div>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Delivery details</h3>
              <div className="mt-2 text-sm text-slate-600">
                <div><strong>{order.recipient}</strong></div>
                {contact && <div>Contact: {contact}</div>}
                <div>{order.address}</div>
                <div className="mt-1">{order.summary}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Order progress</h3>
              <OrderTimeline phases={phases} currentIndex={currentIndex} />
            </div>
          </div>

          <aside className="bg-slate-50 p-4 rounded-md text-sm">
            <div className="mb-3">
              <div className="text-slate-600">Current status</div>
              <div className="text-olive-green font-semibold text-lg">{phases[currentIndex].label}</div>
            </div>

            <div>
              <div className="text-slate-600">Last update</div>
              <div className="text-sm text-slate-700">{fmt(phases[currentIndex].time)}</div>
            </div>
          </aside>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Updates</h3>
          <ol className="space-y-3">
            {phases.map((p) => (
              <li key={p.key} className="flex items-start gap-3">
                <div className="w-3 h-3 mt-1 rounded-full" style={{ background: p.time ? undefined : '#E6E6E6' }}>
                  <span className={`block w-3 h-3 rounded-full ${p.time ? 'bg-olive-green' : 'bg-slate-200'}`} />
                </div>
                <div className="flex-1 text-sm">
                  <div className="font-medium text-slate-800">{p.label}</div>
                  <div className="text-slate-500 text-xs">{p.time ? fmt(p.time) : 'Pending'}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Item details & support (requested section) */}
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Items in this order</h3>
          <div className="bg-slate-50 p-4 rounded-md">
            <ul className="space-y-3">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-white flex-shrink-0">
                    <Image src={it.image} alt={it.name} width={56} height={56} />
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-slate-800">{it.name}</div>
                    <div className="text-slate-500 text-xs">Qty: {it.qty}</div>
                  </div>
                  <div className="text-sm font-medium">₹{it.price}</div>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t pt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Payment</div>
                <div className="text-sm font-medium">{order.paymentStatus} • {order.paymentMethod}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Total</div>
                <div className="text-lg font-semibold">₹{order.items.reduce((s, i) => s + i.price * i.qty, 0)}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium mb-1">Need help?</div>
                <div className="text-xs text-slate-600">For urgent support:</div>
                <div className="flex items-center gap-3 mt-2">
                  <a className="text-xs text-olive-green underline" href="https://wa.me/911234567890" aria-label="Chat on WhatsApp">WhatsApp</a>
                  <a className="text-xs text-olive-green underline" href="tel:+911234567890" aria-label="Call support">Call</a>
                  <a className="text-xs text-olive-green underline" href="mailto:support@example.com" aria-label="Email support">Email</a>
                  <Link className="text-xs text-olive-green underline" href="/contact" aria-label="Open chat">Chat</Link>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* allow cancel/modify only before out-for-delivery */}
                {currentIndex <= 1 ? (
                  <>
                    <Link href={`/contact?subject=Modify%20Order%20${order.id}`} className="px-3 py-2 text-sm border rounded-md text-slate-700 bg-white hover:bg-slate-100" aria-label="Modify order">Modify</Link>
                    <Link href={`/contact?subject=Cancel%20Order%20${order.id}`} className="px-3 py-2 text-sm bg-red-600 text-white rounded-md" aria-label="Cancel order">Cancel</Link>
                  </>
                ) : (
                  <>
                    <button className="px-3 py-2 text-sm border rounded-md text-slate-400 bg-white cursor-not-allowed" disabled aria-hidden>Modify</button>
                    <button className="px-3 py-2 text-sm border rounded-md text-slate-400 bg-white cursor-not-allowed" disabled aria-hidden>Cancel</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
