import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import Slider, { getFallbackSlides } from '../Slider'

const PLACEHOLDER = '/images/placeholder-bloom.jpg'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Slider fallback slides', () => {
  it('uses local static images, never remote URLs or the placeholder', () => {
    const slides = getFallbackSlides()
    expect(slides.length).toBeGreaterThan(0)
    for (const s of slides) {
      // Under Next these are StaticImageData objects; under vite they are asset path strings.
      const src = typeof s.img === 'string' ? s.img : (s.img?.src ?? '')
      expect(src).toMatch(/^\//)
      expect(src).not.toMatch(/^https?:\/\//)
      expect(src).not.toContain('shopify')
      expect(src).not.toBe(PLACEHOLDER)
    }
  })

  it('renders non-placeholder, non-shopify images when the API returns no sliders', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)
    const { container } = render(<Slider />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const imgs = Array.from(container.querySelectorAll('img'))
    expect(imgs.length).toBeGreaterThan(0)
    for (const img of imgs) {
      const src = decodeURIComponent(img.getAttribute('src') ?? '')
      expect(src).not.toContain('placeholder-bloom')
      expect(src).not.toContain('shopify')
    }
  })
})
