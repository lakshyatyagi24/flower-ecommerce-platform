import { useState, useEffect } from 'react';
// import { getProducts } from '../api/productsApi';
import { Product } from '../types';
import { mockProducts } from '../mockProducts'; // Assuming you have a mockProducts file for testing

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  //   useEffect(() => {
  //     getProducts()
  //       .then(setProducts)
  //       .finally(() => setLoading(false));
  //   }, []);

  useEffect(() => {
    // Simulate async fetch
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 500);
  }, []);

  return { products, loading };
}
