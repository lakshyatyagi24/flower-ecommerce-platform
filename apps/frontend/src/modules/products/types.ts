import { StaticImageData } from 'next/dist/shared/lib/image-external';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string | StaticImageData;
  description: string;
}
