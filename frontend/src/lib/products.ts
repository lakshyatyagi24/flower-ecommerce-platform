import s1 from "../assets/slider1.png";
import s2 from "../assets/slider2.png";
import s3 from "../assets/slider3.png";
import s4 from "../assets/slider4.png";
import s5 from "../assets/slider5.png";
import s6 from "../assets/slider6.png";

export type Product = {
  id: string;
  title: string;
  img: typeof s1;
  price: string;
  description?: string;
  collection?: string;
};

export const products: Product[] = [
  { id: "sc1", title: "Autumn Bouquet", img: s1, price: "\u20b9750.00", description: "Hand-tied seasonal bouquet with rustic foliage.", collection: "autumn-rustic" },
  { id: "sc2", title: "Rustic Wrap", img: s2, price: "\u20b9499.00", description: "Wrapped stems with natural kraft and twine.", collection: "autumn-rustic" },
  { id: "sc3", title: "Heritage Spray", img: s3, price: "\u20b91,150.00", description: "A statement spray with heritage tones.", collection: "autumn-rustic" },
  { id: "sc4", title: "Fireside Posy", img: s4, price: "\u20b9399.00", description: "Small posy perfect for mantle displays.", collection: "autumn-rustic" },
  { id: "sc5", title: "Moss & Fern", img: s5, price: "\u20b9999.00", description: "Earthy centerpiece mixing moss and ferns.", collection: "autumn-rustic" },
  { id: "sc6", title: "Woodland Mix", img: s6, price: "\u20b9650.00", description: "Loose stems for DIY arranging.", collection: "autumn-rustic" },
];
