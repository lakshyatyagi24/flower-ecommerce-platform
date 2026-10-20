export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

export type AuthResponse = { token: string; user: AuthUser };

export type ProductType = 'CUT_FLOWER' | 'PLANT' | 'BOUQUET' | 'ARRANGEMENT' | 'HAMPER';
export type SaleMode = 'PURCHASE' | 'ENQUIRY';

export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  parentId?: number | null;
  productType?: ProductType;
  defaultSaleMode?: SaleMode;
  defaultGstRate?: number;
  sortOrder?: number;
  active?: boolean;
  /** Number of ACTIVE products in this category (own products, not children). Undefined from older backends. */
  productCount?: number;
  children?: ApiCategory[];
};

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  productType?: ProductType;
  saleMode?: SaleMode;
  gstRate?: number;
  unit?: string;
  minOrderQty?: number;
  categoryId: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
    productType?: ProductType;
    defaultSaleMode?: SaleMode;
  } | null;
  averageRating?: number;
  reviewCount?: number;
  tags?: string[];
};

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'popular';

export type ApiProductList = {
  items: ApiProduct[];
  total: number;
  take?: number;
  skip?: number;
  page?: number;
  pages?: number;
};

export type ApiEnquiry = {
  id: number;
  productId: number | null;
  productName: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  quantity: number | null;
  eventDate: string | null;
  occasion: string | null;
  budget: number | null;
  address: string | null;
  city: string | null;
  message: string | null;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: number; name: string; slug: string } | null;
};

export type ApiReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ApiReview = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title: string | null;
  body: string;
  /** Present only on the caller's own review (public items are all approved and carry no status). */
  status?: ApiReviewStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string | null } | null;
};

export type ApiReviewList = {
  items: ApiReview[];
  total: number;
  take: number;
  skip: number;
  averageRating: number;
  /** The signed-in caller's own review in any status (never another user's). */
  ownReview?: ApiReview | null;
};

export type ApiReviewEligibility = { canReview: boolean; hasReview: boolean };

export type ApiOrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  product?: { id: number; slug: string; image: string | null } | null;
};

export type ApiOrderItem2 = ApiOrderItem & { gstRate?: number; gstAmount?: number };

export type ApiOrder = {
  id: number;
  userId: number | null;
  subtotal: number;
  shipping: number;
  gst?: number;
  /** Coupon applied at checkout and the rupees it took off the subtotal (absent / 0 on older orders). */
  couponCode?: string | null;
  discount?: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  /** Chosen delivery date: UTC midnight of the IST calendar date (null for orders placed before dates existed). */
  deliveryDate?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ApiOrderItem2[];
  user?: { id: number; email: string; name: string | null } | null;
};
