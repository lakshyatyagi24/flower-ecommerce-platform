export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'ADMIN';
};

export type AdminProductType = 'CUT_FLOWER' | 'PLANT' | 'BOUQUET' | 'ARRANGEMENT' | 'HAMPER';
export type AdminSaleMode = 'PURCHASE' | 'ENQUIRY';

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  productType?: AdminProductType;
  saleMode?: AdminSaleMode;
  gstRate?: number;
  unit?: string;
  minOrderQty?: number;
  tags?: string[];
  categoryId: number | null;
  category?: { id: number; name: string; slug: string; productType?: AdminProductType; defaultSaleMode?: AdminSaleMode } | null;
};

export type AdminEnquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';

export type AdminEnquiry = {
  id: number;
  userId: number | null;
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
  status: AdminEnquiryStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: number; name: string; slug: string } | null;
  user?: { id: number; email: string; name: string | null } | null;
};

export type AdminOrder = {
  id: number;
  userId: number | null;
  subtotal: number;
  shipping: number;
  gst?: number;
  /** Coupon applied at checkout and the rupees it took off the subtotal (0 / null on older orders). */
  couponCode?: string | null;
  discount?: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: 'COD' | 'RAZORPAY' | string;
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paidAt?: string | null;
  refundNote?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  adminNotes?: string | null;
  /** Customer-chosen delivery date: UTC midnight of the India calendar date. Null on older orders. */
  deliveryDate?: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  user?: { id: number; email: string; name: string | null } | null;
};

export type AdminCoupon = {
  id: number;
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
};

export type AdminCouponInput = {
  code?: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  maxUses: number | null;
  active: boolean;
};

export type AdminSlider = {
  id: number;
  title?: string | null;
  eyebrow?: string | null;
  subtitle?: string | null;
  alt?: string | null;
  image?: string | null;
  href?: string | null;
  config?: Record<string, unknown> | null;
  sortOrder: number;
  active: boolean;
};

export type AdminSliderInput = {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  alt?: string;
  image?: string;
  href?: string;
  config?: Record<string, unknown>;
  sortOrder?: number;
  active?: boolean;
};

export type AdminStatsSeriesPoint = { date: string; orders: number; revenue: number };

export type AdminStats = {
  orderCount: number;
  productCount: number;
  customerCount: number;
  revenue: number;
  openEnquiries: number;
  unpaidOnline?: number;
  refundsDue?: number;
  mismatches?: number;
  recentOrders: { id: number; customerName: string | null; total: number; status: string; createdAt: string }[];
  /** One point per IST day in the requested range (zero-filled). */
  series?: AdminStatsSeriesPoint[];
  range?: { from: string; to: string };
};

export type AdminOrderFilters = {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  attention?: string;
  sort?: 'deliveryDate';
  /** Free-text search: order id, customer email / name / phone. */
  q?: string;
};

export type AdminOrderPatch = {
  status?: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  adminNotes?: string | null;
  shippingAddress?: string | null;
  city?: string | null;
  postalCode?: string | null;
  customerPhone?: string | null;
  paymentStatus?: 'REFUNDED';
  refundNote?: string | null;
};

export type AdminCustomer = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  orderCount: number;
};

export type AdminSubscriber = {
  id: number;
  email: string;
  source: string;
  createdAt: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  parentId?: number | null;
  productType?: AdminProductType;
  defaultSaleMode?: AdminSaleMode;
  defaultGstRate?: number;
  sortOrder?: number;
  active?: boolean;
  children?: AdminCategory[];
};

export type AdminCategoryInput = {
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  parentId?: number | null;
  productType?: AdminProductType;
  defaultSaleMode?: AdminSaleMode;
  defaultGstRate?: number;
  sortOrder?: number;
  active?: boolean;
};

export type AdminReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminReview = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title: string | null;
  body: string;
  status: AdminReviewStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string | null; email?: string | null } | null;
  product?: { id: number; name: string; slug: string } | null;
};
export type CsvDownload = { filename: string; rows: number | null; total: number | null; truncated: boolean };
