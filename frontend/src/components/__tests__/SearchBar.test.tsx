import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import SearchBar from '@/components/SearchBar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    listProducts: vi.fn().mockResolvedValue({
      items: [
        { id: 1, slug: 'autumn-bouquet', name: 'Autumn Bouquet', price: 1200, image: null },
        { id: 2, slug: 'autumn-roses', name: 'Autumn Roses', price: 900, image: null },
      ],
    }),
    listCategories: vi.fn().mockResolvedValue([]),
  },
}))

describe('SearchBar keyboard navigation', () => {
  it('labels the search input and sets aria-activedescendant when navigating suggestions', async () => {
    render(<SearchBar />)
    const input = screen.getByRole('searchbox', { name: /search for products/i }) as HTMLInputElement

    await userEvent.type(input, 'autumn')
    const suggestionList = await screen.findByRole('listbox')
    expect(suggestionList).toBeInTheDocument()

    await userEvent.keyboard('{ArrowDown}')
    const active = input.getAttribute('aria-activedescendant')
    expect(active).toBeTruthy()
    const activeItem = document.getElementById(active as string)
    expect(activeItem).toBeInTheDocument()
  })
})
