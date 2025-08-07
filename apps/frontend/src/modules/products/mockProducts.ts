import { Product } from './types';
import productImage from '../../assets/product.png';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Rustic Wildflower Bouquet',
    price: 1599,
    image: productImage,
    description: 'A hand-tied bouquet of natural wildflowers, perfect for rustic weddings.',
  },
  {
    id: '2',
    name: 'Artisanal Rose Mix',
    price: 1899,
    image: productImage,
    description: 'Classic and elegant rose arrangement in a natural, artisanal style.',
  },
  {
    id: '3',
    name: 'Lavender Charm',
    price: 1299,
    image: productImage,
    description: 'A fragrant mix of lavender and eucalyptus for calming occasions.',
  },
];
