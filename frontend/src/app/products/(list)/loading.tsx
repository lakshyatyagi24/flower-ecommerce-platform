import Container from "@/components/ui/Container";
import Skeleton from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <main className="pb-24" aria-busy="true">
      <Container>
        <div className="space-y-4 py-12">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-72" />
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
