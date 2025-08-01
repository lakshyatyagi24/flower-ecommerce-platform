import { Product } from '../types';

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}
