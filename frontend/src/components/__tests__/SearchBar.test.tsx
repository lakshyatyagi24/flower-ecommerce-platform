import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from '@/components/SearchBar'

describe('SearchBar keyboard navigation', () => {
  it('sets aria-activedescendant when navigating suggestions', async () => {
    render(<SearchBar />)
    const input = screen.getByRole('searchbox') as HTMLInputElement

    await userEvent.type(input, 'autumn')
    // allow suggestions to render (no debounce in implementation)
    const suggestionList = await screen.findByRole('listbox')
    expect(suggestionList).toBeInTheDocument()

    // press ArrowDown and expect aria-activedescendant to point to an item id
    await userEvent.keyboard('{ArrowDown}')
    const active = input.getAttribute('aria-activedescendant')
    expect(active).toBeTruthy()
    const activeItem = document.getElementById(active as string)
    expect(activeItem).toBeInTheDocument()
  })
})
