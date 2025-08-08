import { FaLock, FaLeaf, FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal } from 'react-icons/fa';

export default function TrustBadges() {
  return (
    <section className="max-w-4xl mx-auto mb-10 mt-14 px-4">
      <div className="flex flex-wrap justify-center gap-8 rounded-xl bg-beige/80 border border-olive-200 shadow p-6">
        {/* Secure Checkout */}
        <div className="flex flex-col items-center text-center">
          <FaLock className="text-accent w-8 h-8 mb-2" />
          <span className="font-serif font-semibold text-brown-800 text-base mb-0.5">
            Secure Checkout
          </span>
          <span className="text-olive-dark text-xs">SSL encryption</span>
        </div>
        {/* Payment Options */}
        <div className="flex flex-col items-center text-center">
          <div className="flex gap-1 mb-2">
            <FaCcVisa className="w-7 h-7 text-green-700" />
            <FaCcMastercard className="w-7 h-7 text-accent" />
            <FaCcAmex className="w-7 h-7 text-primary" />
            <FaCcPaypal className="w-7 h-7 text-brown-800" />
          </div>
          <span className="font-serif font-semibold text-brown-800 text-base mb-0.5">
            Multiple Payments
          </span>
          <span className="text-olive-dark text-xs">Visa, MasterCard, Amex, PayPal</span>
        </div>
        {/* Eco Friendly */}
        <div className="flex flex-col items-center text-center">
          <FaLeaf className="text-green-700 w-8 h-8 mb-2" />
          <span className="font-serif font-semibold text-brown-800 text-base mb-0.5">
            Eco Conscious
          </span>
          <span className="text-olive-dark text-xs">Local flowers · Recyclable wrap</span>
        </div>
      </div>
    </section>
  );
}
