import Container from '@/components/ui/Container';
import SectionHeading from '@/components/ui/SectionHeading';
import ProductGrid from '@/components/product/ProductGrid';
import type { ApiProduct } from '@/lib/api';

type Props = {
  title: string;
  eyebrow?: string;
  link?: { href: string; label: string };
  products: ApiProduct[];
  /** Cards that load eagerly. Everything below the hero stays lazy by default. */
  priorityCount?: number;
};

/** Heading plus a 4-up (2-up on mobile) product grid. Renders nothing when there are no products. */
export default function ProductSection({ title, eyebrow, link, products, priorityCount = 0 }: Props) {
  if (products.length === 0) return null;
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} link={link} />
        <div className="mt-10 md:mt-14">
          <ProductGrid products={products} priorityCount={priorityCount} headingLevel={3} />
        </div>
      </Container>
    </section>
  );
}
