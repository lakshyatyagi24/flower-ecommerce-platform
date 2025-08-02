import type { CartItem } from '../types';

export default function CartItem({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span>
        {item.product.name} × {item.quantity}
      </span>
      <span>${item.product.price * item.quantity}</span>
      <button
        className="ml-4 text-red-600 hover:underline"
        onClick={() => onRemove(item.product.id)}
      >
        Remove
      </button>
    </div>
  );
}
