import type { Order } from '../types';

export async function submitOrder(order: Omit<Order, 'id' | 'status'>) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error('Order submission failed');
  return response.json();
}
