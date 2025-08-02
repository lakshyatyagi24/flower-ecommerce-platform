export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentInfo {
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export interface Order {
  id: string;
  items: Array<{ productId: string; quantity: number }>;
  address: Address;
  paymentInfo?: PaymentInfo; // Do NOT store this in frontend state after submission!
  total: number;
  status: 'pending' | 'paid' | 'failed';
}
