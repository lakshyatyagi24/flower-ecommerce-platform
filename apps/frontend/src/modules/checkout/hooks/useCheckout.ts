import { useState } from 'react';
import type { Address, PaymentInfo, Order } from '../types';
import { submitOrder } from '../api/checkoutApi';

export function useCheckout() {
  const [address, setAddress] = useState<Address | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (cartItems: Array<{ productId: string; quantity: number }>, address: Address, paymentInfo: PaymentInfo, total: number) => {
    setLoading(true);
    setError(null);
    try {
      const newOrder = await submitOrder({
        items: cartItems,
        address,
        paymentInfo,
        total,
      });
      setOrder(newOrder);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { address, setAddress, paymentInfo, setPaymentInfo, loading, checkout, order, error };
}
