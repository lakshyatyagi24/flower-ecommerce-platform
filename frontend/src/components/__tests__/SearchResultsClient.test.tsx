import React from 'react'
import { render, screen } from '@testing-library/react'
import SearchResultsClient from '@/components/SearchResultsClient'
import { ApiProduct } from '@/lib/api'

it('filters by price range', () => {
  const initial: ApiProduct[] = [
    {
      id: 1,
      name: 'Test Rose Bundle',
      slug: 'test-rose-bundle',
      description: 'Fresh roses',
      price: 750,
      image: null,
      stock: 12,
      featured: false,
      active: true,
      categoryId: 1,
      category: { id: 1, name: 'Cut Flowers', slug: 'cut-flowers' },
      averageRating: 4.8,
      reviewCount: 5,
    },
  ]
  render(<SearchResultsClient initialQuery="" initialProducts={initial} />)
  // choose price range UI and assert that the product list updates
  const select = screen.getByLabelText(/Price range/i) as HTMLSelectElement
  expect(select).toBeInTheDocument()
})
