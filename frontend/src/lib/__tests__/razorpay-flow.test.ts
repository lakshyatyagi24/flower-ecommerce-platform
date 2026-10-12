import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiError } from '@/lib/api'
import { payForOrder } from '../razorpay-flow'

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    status: number
    constructor(m: string, s: number) {
      super(m)
      this.status = s
    }
  }
  return { ApiError, api: { createRazorpayOrder: vi.fn(), verifyRazorpay: vi.fn() } }
})

const create = api.createRazorpayOrder as unknown as ReturnType<typeof vi.fn>
const verify = api.verifyRazorpay as unknown as ReturnType<typeof vi.fn>

const ORDER = {
  keyId: 'rzp_test_x', razorpayOrderId: 'order_1', amount: 12300, currency: 'INR', name: 'Fresh Petals',
  prefill: { name: 'A', email: 'a@b.co', contact: '9999911111' },
}
let instances: any[]

function handlers() {
  return { onPaid: vi.fn(), onRefundDue: vi.fn(), onDismiss: vi.fn(), onFailure: vi.fn(), onVerifyError: vi.fn(), onError: vi.fn() }
}
const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  instances = []
  create.mockReset().mockResolvedValue(ORDER)
  verify.mockReset()
  ;(window as any).Razorpay = function (this: any, o: any) {
    this.options = o
    this.handlers = {}
    this.on = (ev: string, fn: any) => (this.handlers[ev] = fn)
    this.open = vi.fn()
    instances.push(this)
  }
})

const PAY = { razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' }

// Each test must leave the module-level in-flight guard released.
function release() {
  instances.forEach((i) => i.options.modal.ondismiss())
}

describe('payForOrder', () => {
  it('verifies with the exact fields and calls onPaid', async () => {
    verify.mockResolvedValue({ ok: true, status: 'PAID' })
    const h = handlers()
    await payForOrder(7, h)
    expect(create).toHaveBeenCalledWith(7)
    instances[0].options.handler(PAY)
    await flush()
    expect(verify).toHaveBeenCalledWith({ orderId: 7, razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', signature: 'sig' })
    expect(h.onPaid).toHaveBeenCalled()
    expect(h.onRefundDue).not.toHaveBeenCalled()
  })

  it('maps CANCELLED to onRefundDue', async () => {
    verify.mockResolvedValue({ ok: true, status: 'CANCELLED' })
    const h = handlers()
    await payForOrder(7, h)
    instances[0].options.handler(PAY)
    await flush()
    expect(h.onRefundDue).toHaveBeenCalled()
    expect(h.onPaid).not.toHaveBeenCalled()
  })

  it('maps verify rejection to onVerifyError with guidance copy', async () => {
    verify.mockRejectedValue(new ApiError('Payment signature invalid', 400, null))
    const h = handlers()
    await payForOrder(7, h)
    instances[0].options.handler(PAY)
    await flush()
    expect(h.onVerifyError).toHaveBeenCalledWith(expect.stringMatching(/could not confirm your payment yet.*check My Orders/i))
    expect(h.onPaid).not.toHaveBeenCalled()
  })

  it('maps createRazorpayOrder 503 to a friendly onError', async () => {
    create.mockRejectedValue(new ApiError('Online payments are not configured', 503, null))
    const h = handlers()
    await payForOrder(7, h)
    expect(h.onError).toHaveBeenCalledWith(expect.stringMatching(/temporarily unavailable.*cash on delivery/i))
    expect(instances.length).toBe(0)
  })

  it('passes through other ApiError messages to onError and releases the guard', async () => {
    create.mockRejectedValue(new ApiError('Not your order', 403, null))
    const h = handlers()
    await payForOrder(7, h)
    expect(h.onError).toHaveBeenCalledWith('Not your order')
    create.mockResolvedValue(ORDER)
    await payForOrder(7, h)
    expect(instances.length).toBe(1)
    release()
  })

  it('maps payment.failed to onFailure and dismiss to onDismiss', async () => {
    const h = handlers()
    await payForOrder(7, h)
    instances[0].handlers['payment.failed']({ error: { description: 'Declined' } })
    expect(h.onFailure).toHaveBeenCalledWith('Declined')
    instances[0].options.modal.ondismiss()
    expect(h.onDismiss).toHaveBeenCalled()
  })

  it('opens only ONE modal on double invocation while in flight, and allows a retry after dismiss', async () => {
    const h = handlers()
    const a = payForOrder(7, h)
    const b = payForOrder(7, h)
    await Promise.all([a, b])
    expect(create).toHaveBeenCalledTimes(1)
    expect(instances.length).toBe(1)
    instances[0].options.modal.ondismiss()
    await payForOrder(7, h)
    expect(instances.length).toBe(2)
    instances[1].options.modal.ondismiss()
  })

  it('does not report dismiss after a successful payment', async () => {
    verify.mockResolvedValue({ ok: true, status: 'PAID' })
    const h = handlers()
    await payForOrder(8, h)
    instances[0].options.handler(PAY)
    instances[0].options.modal.ondismiss()
    await flush()
    expect(h.onDismiss).not.toHaveBeenCalled()
    expect(h.onPaid).toHaveBeenCalled()
  })
})
