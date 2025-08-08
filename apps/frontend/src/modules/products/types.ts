import { StaticImageData } from 'next/dist/shared/lib/image-external';

export type Product = {
  id: string;
  name: string;
  price: number;
  image: StaticImageData | string;
  description: string;
  tags?: string[];
  salesCount?: number;
};

