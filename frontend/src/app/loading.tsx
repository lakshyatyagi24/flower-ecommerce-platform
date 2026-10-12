import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 py-16 md:px-8" aria-busy="true">
      <Skeleton className="h-10 w-64" />
    </main>
  );
}
