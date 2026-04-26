import { redirect } from "next/navigation";

// allow loose props shape to satisfy Next's PageProps during build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function SearchPage(props: any) {
  const rawSearchParams = await props?.searchParams;
  const searchParams = typeof rawSearchParams === "object" && rawSearchParams !== null
    ? (rawSearchParams as Record<string, string | string[] | undefined>)
    : undefined;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  redirect(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
}
