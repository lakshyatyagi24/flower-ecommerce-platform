import React, { useState } from 'react';
import type { Address, PaymentInfo } from '../types';

interface Props {
  onCheckout: (address: Address, payment: PaymentInfo) => void;
  loading: boolean;
}

export default function CheckoutForm({ onCheckout, loading }: Props) {
  const [address, setAddress] = useState<Address>({ name: '', street: '', city: '', state: '', postalCode: '', country: '' });
  const [payment, setPayment] = useState<PaymentInfo>({ cardNumber: '', expiry: '', cvc: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckout(address, payment);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
      {/* Add address fields */}
      {/* Add payment fields */}
      <button type="submit" disabled={loading} className="bg-green-700 text-white px-4 py-2 rounded">
        {loading ? 'Processing...' : 'Place Order'}
      </button>
    </form>
  );
}
