import Container from "@/components/ui/Container";
import Skeleton from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <main className="pb-24" aria-busy="true">
      <Container>
        <div className="py-6">
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-5 md:py-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="mt-8 h-14 w-full" />
            <Skeleton className="mt-8 h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </Container>
    </main>
  );
}
