import { Product } from '../types';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg shadow p-4 bg-white">
      <img src={product.image} alt={product.name} className="rounded" />
      <h2 className="font-bold mt-2">{product.name}</h2>
      <p>{product.description}</p>
      <div className="font-semibold text-green-600 mt-1">${product.price}</div>
    </div>
  );
}
