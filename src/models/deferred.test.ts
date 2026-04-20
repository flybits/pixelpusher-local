import { describe, it, expect, vi } from 'vitest'
import Deferred from './deferred.ts'

describe('Deferred', () => {
  it('resolves and exposes the same promise', async () => {
    const d = new Deferred<number>()
    const onFulfilled = vi.fn()
    void d.promise.then(onFulfilled)
    d.resolve(42)
    await d.promise
    expect(onFulfilled).toHaveBeenCalledWith(42)
  })

  it('rejects', async () => {
    const d = new Deferred<string>()
    const err = new Error('x')
    d.reject(err)
    await expect(d.promise).rejects.toBe(err)
  })

  it('then delegates to the underlying promise', async () => {
    const d = new Deferred<number>()
    const p = d.then((v) => v + 1)
    d.resolve(1)
    await expect(p).resolves.toBe(2)
  })

  it('catch delegates to the underlying promise', async () => {
    const d = new Deferred<number>()
    const p = d.catch(() => 7)
    d.reject(new Error('fail'))
    await expect(p).resolves.toBe(7)
  })
})
