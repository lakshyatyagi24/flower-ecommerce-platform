import { describe, it, expect, beforeEach, vi } from 'vitest'

const SRC = 'script[src*="checkout.razorpay.com"]'

async function fresh() {
  vi.resetModules()
  return await import('../razorpay')
}

beforeEach(() => {
  document.querySelectorAll(SRC).forEach((s) => s.remove())
  ;(window as any).Razorpay = undefined
})

describe('loadRazorpay', () => {
  it('injects the script exactly once and resolves all callers on load', async () => {
    const { loadRazorpay } = await fresh()
    const p1 = loadRazorpay()
    const p2 = loadRazorpay()
    const scripts = document.querySelectorAll(SRC)
    expect(scripts.length).toBe(1)
    expect((scripts[0] as HTMLScriptElement).src).toBe('https://checkout.razorpay.com/v1/checkout.js')
    scripts[0].dispatchEvent(new Event('load'))
    await expect(Promise.all([p1, p2])).resolves.toBeDefined()
  })

  it('resets after an error so a retry injects a new script', async () => {
    const { loadRazorpay } = await fresh()
    const p1 = loadRazorpay()
    document.querySelector(SRC)!.dispatchEvent(new Event('error'))
    await expect(p1).rejects.toThrow(/payment/i)
    const p2 = loadRazorpay()
    const scripts = document.querySelectorAll(SRC)
    expect(scripts.length).toBe(1) // failed one removed, one fresh
    scripts[0].dispatchEvent(new Event('load'))
    await expect(p2).resolves.toBeUndefined()
  })

  it('is a no-op when window.Razorpay already exists', async () => {
    ;(window as any).Razorpay = function () {}
    const { loadRazorpay } = await fresh()
    await expect(loadRazorpay()).resolves.toBeUndefined()
    expect(document.querySelectorAll(SRC).length).toBe(0)
  })
})

describe('openCheckout', () => {
  it('passes timeout, confirm_close, prefill, theme and wires handlers', async () => {
    const instances: any[] = []
    ;(window as any).Razorpay = function (this: any, o: any) {
      this.options = o
      this.handlers = {}
      this.on = (ev: string, fn: any) => (this.handlers[ev] = fn)
      this.open = vi.fn()
      instances.push(this)
    }
    const { openCheckout } = await fresh()
    const onSuccess = vi.fn()
    const onDismiss = vi.fn()
    const onFailure = vi.fn()
    await openCheckout({
      keyId: 'k', razorpayOrderId: 'o1', amount: 5000, name: 'Shop',
      prefill: { name: 'A', email: 'a@b.co', contact: '999' },
      onSuccess, onDismiss, onFailure,
    })
    const r = instances[0]
    expect(r.open).toHaveBeenCalledTimes(1)
    expect(r.options).toMatchObject({ key: 'k', order_id: 'o1', amount: 5000, currency: 'INR', timeout: 1200 })
    expect(r.options.modal.confirm_close).toBe(true)
    expect(r.options.theme.color).toBe('#7C835A')
    r.options.handler({ razorpay_order_id: 'o1', razorpay_payment_id: 'p', razorpay_signature: 's' })
    expect(onSuccess).toHaveBeenCalledWith({ razorpay_order_id: 'o1', razorpay_payment_id: 'p', razorpay_signature: 's' })
    r.options.modal.ondismiss()
    expect(onDismiss).toHaveBeenCalled()
    r.handlers['payment.failed']({ error: { description: 'Card declined' } })
    expect(onFailure).toHaveBeenCalledWith('Card declined')
    r.handlers['payment.failed']({})
    expect(onFailure).toHaveBeenLastCalledWith('Payment failed')
  })
})
