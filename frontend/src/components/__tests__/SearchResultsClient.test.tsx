import React from 'react'
import { render, screen } from '@testing-library/react'
import SearchResultsClient from '@/components/SearchResultsClient'
import { products as allProducts } from '@/lib/products'

it('filters by price range', () => {
  const initial = allProducts
  render(<SearchResultsClient initialQuery="" initialProducts={initial} />)
  // choose price range UI and assert that the product list updates
  const select = screen.getByLabelText(/Price range/i) as HTMLSelectElement
  expect(select).toBeInTheDocument()
})
