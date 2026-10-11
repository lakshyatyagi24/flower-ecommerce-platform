import type { Metadata } from "next";
import ResetPasswordView from "./reset-password-view";

// The reset token lives in the URL: never leak it via the Referer header and never index the page.
export const metadata: Metadata = {
  title: "Reset password",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function AdminResetPasswordPage() {
  return <ResetPasswordView />;
}
