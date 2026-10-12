import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import OrderTimeline from '../OrderTimeline'

const t = new Date('2026-10-12T10:30:00Z')
const base = [
  { key: 'placed', label: 'Order Placed', time: t },
  { key: 'preparing', label: 'Preparing', time: null },
  { key: 'out', label: 'Out for Delivery', time: null },
  { key: 'delivered', label: 'Delivered', time: null },
]

function states(container: HTMLElement) {
  return Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-state'))
}

describe('OrderTimeline', () => {
  it('is a labelled ordered list with one item per phase', () => {
    render(<OrderTimeline phases={base} currentIndex={0} />)
    const list = screen.getByRole('list', { name: /order progress/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)
  })

  it('placed only: first step is current, the rest upcoming', () => {
    const { container } = render(<OrderTimeline phases={base} currentIndex={0} />)
    expect(states(container)).toEqual(['current', 'upcoming', 'upcoming', 'upcoming'])
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(items[1]).not.toHaveAttribute('aria-current')
  })

  it('shipped: earlier steps done, the third is current, the last upcoming', () => {
    const phases = [
      { ...base[0] },
      { ...base[1], time: t },
      { ...base[2], time: t },
      { ...base[3] },
    ]
    const { container } = render(<OrderTimeline phases={phases} currentIndex={2} />)
    expect(states(container)).toEqual(['done', 'done', 'current', 'upcoming'])
    expect(screen.getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step')
  })

  it('conveys state in text for screen readers and shows timestamps for reached steps only', () => {
    const phases = [{ ...base[0] }, { ...base[1], time: t }, base[2], base[3]]
    const { container } = render(<OrderTimeline phases={phases} currentIndex={1} />)
    expect(screen.getByText(/Order Placed/).textContent).toContain('Completed')
    expect(screen.getByText(/Preparing/).textContent).toContain('Current step')
    expect(screen.getByText(/Delivered/).textContent).toContain('Upcoming')
    expect(container.querySelectorAll('time')).toHaveLength(2)
    expect(container.querySelector('time')!.getAttribute('datetime')).toBe(t.toISOString())
  })

  it('completed segments of the line are moss, later ones stone', () => {
    const phases = [{ ...base[0] }, { ...base[1], time: t }, base[2], base[3]]
    const { container } = render(<OrderTimeline phases={phases} currentIndex={1} />)
    const lines = Array.from(container.querySelectorAll('li > span.w-px'))
    expect(lines).toHaveLength(3)
    expect(lines[0].className).toContain('bg-moss')
    expect(lines[1].className).toContain('bg-stone-light')
  })

  it('has no interactive pseudo-buttons', () => {
    render(<OrderTimeline phases={base} currentIndex={0} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
