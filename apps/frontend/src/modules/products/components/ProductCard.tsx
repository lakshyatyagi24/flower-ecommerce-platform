import { Product } from '../types';
import Image from 'next/image';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-olive-200 max-w-xs mx-auto flex flex-col transition-transform duration-150 hover:scale-105 hover:shadow-lg">
      <Image
        src={product.image}
        alt={product.name}
        className="w-full h-56 object-cover border-b border-olive-200 transition-transform duration-150"
      />
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="font-serif text-lg font-bold mb-2 text-brown-800">{product.name}</h2>
        <p className="text-sm text-gray-700 mb-4">{product.description}</p>
        <span className="text-lg font-semibold text-green-700 mt-auto">${product.price}</span>
      </div>
    </div>
  );
}
