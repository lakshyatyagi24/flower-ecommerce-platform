import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useApi } from '../use-api';

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

  it('does not set state or warn when unmounted before resolve', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let resolve!: (v: number) => void;
    const p = new Promise<number>((r) => (resolve = r));
    const { result, unmount } = renderHook(() => useApi(() => p, []));
    unmount();
    resolve(1);
    await p;
    await Promise.resolve();
    expect(result.current.data).toBeNull();
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
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
