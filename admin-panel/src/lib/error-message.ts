import { ApiError } from "@/lib/api";

/** The server's message for an ApiError, otherwise the given fallback. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
