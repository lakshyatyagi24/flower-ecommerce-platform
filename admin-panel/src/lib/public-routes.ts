// Routes reachable while logged out (and rendered without the admin chrome).
const PUBLIC_ADMIN_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function isPublicAdminRoute(pathname: string | null | undefined): boolean {
  return !!pathname && PUBLIC_ADMIN_ROUTES.includes(pathname.replace(/\/+$/, "") || "/");
}
