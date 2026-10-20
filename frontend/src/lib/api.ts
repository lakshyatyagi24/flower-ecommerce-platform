// Centralized API client for the storefront. The implementation lives in ./api/*; this module keeps the
// original import path (`@/lib/api`) stable by re-exporting the client, the types and the composed `api` object.
import { authApi } from './api/auth';
import { catalogApi } from './api/catalog';
import { deliveryApi } from './api/delivery';
import { miscApi } from './api/misc';
import { ordersApi } from './api/orders';
import { paymentsApi } from './api/payments';
import { reviewsApi } from './api/reviews';

export * from './api/client';
export * from './api/types';

export const api = {
  ...authApi,
  ...catalogApi,
  ...ordersApi,
  ...deliveryApi,
  ...paymentsApi,
  ...reviewsApi,
  ...miscApi,
};
