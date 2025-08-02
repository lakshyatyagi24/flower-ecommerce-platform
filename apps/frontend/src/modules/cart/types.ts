import type { Product } from '../products/types';

export interface CartItem {
  product: Product;
  quantity: number;
}
