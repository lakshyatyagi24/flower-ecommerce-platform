import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useApi } from '../use-api';

// Count every state-setter invocation made through React.useState so tests can
// prove the hook never *attempts* an update after unmount (React 18 ignores
// those silently, so warnings/render counts cannot).
const spy = vi.hoisted(() => ({ setterCalls: 0 }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    default: actual,
    useState: ((init: never) => {
      const [v, set] = actual.useState(init);
      const wrapped = (...a: unknown[]) => {
        spy.setterCalls++;
        return (set as (...x: unknown[]) => void)(...a);
      };
      return [v, wrapped];
    }) as unknown as typeof actual.useState,
  };
});

describe('useApi', () => {
  it('returns data', async () => {
    const { result } = renderHook(() => useApi(() => Promise.resolve(42), []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
  });

  it('surfaces errors and can reload', async () => {
    let n = 0;
    const { result } = renderHook(() =>
      useApi(() => (n++ === 0 ? Promise.reject(new Error('boom')) : Promise.resolve('ok')), []),
    );
    await waitFor(() => expect(result.current.error).toBe('boom'));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(result.current.error).toBeNull();
  });

  it('does not call any state setter when the promise settles after unmount', async () => {
    let resolve!: (v: number) => void;
    let reject!: (e: Error) => void;
    const ok = new Promise<number>((r) => (resolve = r));
    const bad = new Promise<number>((_, r) => (reject = r));
    bad.catch(() => {});

    const a = renderHook(() => useApi(() => ok, []));
    const b = renderHook(() => useApi(() => bad, []));
    const callsAtUnmount = spy.setterCalls; // includes the synchronous loading/error resets on mount
    a.unmount();
    b.unmount();
    await act(async () => {
      resolve(1);
      reject(new Error('late'));
      await ok;
      await bad.catch(() => {});
    });

    expect(spy.setterCalls).toBe(callsAtUnmount);
    expect(a.result.current.data).toBeNull();
    expect(b.result.current.error).toBeNull();
  });

  it('refetches when deps change and the latest result wins over a stale one', async () => {
    const resolvers: Record<string, (v: string) => void> = {};
    const fn = (key: string) => new Promise<string>((r) => (resolvers[key] = r));
    const { result, rerender } = renderHook(({ k }) => useApi(() => fn(k), [k]), {
      initialProps: { k: 'a' },
    });
    rerender({ k: 'b' });
    await act(async () => {
      resolvers['b']('B');
    });
    await waitFor(() => expect(result.current.data).toBe('B'));
    await act(async () => {
      resolvers['a']('A'); // stale response arrives late
    });
    expect(result.current.data).toBe('B');
    expect(result.current.loading).toBe(false);
  });
});
