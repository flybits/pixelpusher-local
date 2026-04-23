import { Canvas } from 'canvas'
import { html, nothing, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `canvasFromFile` uses `Image` + blob URLs; in happy-dom that load path does not
 * reliably reach `onload` for these tests. Stub `canvasFromFile` so `selectFile` /
 * `selectURL` integration tests exercise the real component pipeline through `toBlob`.
 */
vi.mock('./utils/canvas', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./utils/canvas.ts')>()
  return {
    ...mod,
    canvasFromFile: async (_file: File) => {
      const c = document.createElement('canvas')
      c.width = 2
      c.height = 2
      const ctx = c.getContext('2d')
      if (!ctx) throw new Error('expected canvas 2d context')
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 2, 2)
      return c
    },
  }
})

import './pixel-pusher.ts'
import type { PixelPusher } from './pixel-pusher.ts'

/** Minimal valid PNG bytes (e.g. mock `fetch` response body for `selectURL`). */
function createPngFile(name: string): File {
  const c = new Canvas(2, 2)
  const buf = c.toBuffer('image/png')
  return new File([new Uint8Array(buf)], name, { type: 'image/png' })
}

/** Compile-time guard: `PixelPusher` must remain assignable to its public selection API. */
type _PublicImageApi = Pick<PixelPusher, 'selectFile' | 'selectURL'>
const _publicApiAssignability: _PublicImageApi = null as unknown as PixelPusher
void _publicApiAssignability

describe('pixel-pusher', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    render(nothing, container)
    container.remove()
  })

  it('registers and renders default upload UI', async () => {
    render(html`<pixel-pusher></pixel-pusher>`, container)
    const el = container.querySelector('pixel-pusher') as PixelPusher
    await el.updateComplete

    expect(el.shadowRoot?.querySelector('.pixel-pusher')).toBeTruthy()
    expect(el.shadowRoot?.querySelector('.upload-area')).toBeTruthy()
    expect(el.shadowRoot?.querySelector('cropper-window')).toBeTruthy()
    expect(el.shadowRoot?.querySelector('filter-window')).toBeTruthy()
    expect(el.aspectRatio).toBe(0)
    expect(el.interactiveFilters).toBe(false)
  })

  it('reflects filter-related attributes', async () => {
    render(html`<pixel-pusher blur="2" rotate="90" grayscale></pixel-pusher>`, container)
    const el = container.querySelector('pixel-pusher') as PixelPusher
    await el.updateComplete
    expect(el.blurPx).toBe(2)
    expect(el.rotateDeg).toBe(90)
    expect(el.grayscale).toBe(true)
  })

  describe('public selectFile / selectURL API', () => {
    it('exposes selectFile and selectURL as callable functions on the element', async () => {
      render(html`<pixel-pusher headless></pixel-pusher>`, container)
      const el = container.querySelector('pixel-pusher') as PixelPusher
      await el.updateComplete

      const api: Pick<PixelPusher, 'selectFile' | 'selectURL'> = el
      expect(typeof api.selectFile).toBe('function')
      expect(typeof api.selectURL).toBe('function')
    })

    it('selectFile emits file-selected then image-edited when crop and filters are off', async () => {
      render(html`<pixel-pusher headless></pixel-pusher>`, container)
      const el = container.querySelector('pixel-pusher') as PixelPusher
      await el.updateComplete

      const file = createPngFile('input.png')
      let fileSelectedDetail: File | undefined
      el.addEventListener('file-selected', (e) => {
        fileSelectedDetail = (e as CustomEvent<File>).detail
      })

      const imageEdited = new Promise<CustomEvent<{ file: File }>>((resolve) => {
        el.addEventListener(
          'image-edited',
          (e) => resolve(e as CustomEvent<{ file: File }>),
          { once: true },
        )
      })

      await el.selectFile(file)

      expect(fileSelectedDetail).toBe(file)

      const edited = await imageEdited
      expect(edited.detail.file).toBeInstanceOf(File)
      expect(edited.detail.file.name).toBe('input.png')
    })

    it('selectURL fetches the URL, derives filename from path, and runs the same pipeline', async () => {
      const pngBytes = createPngFile('ignored.png')
      const arrayBuf = await pngBytes.arrayBuffer()

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(arrayBuf, {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'image/png' },
        }),
      )

      render(html`<pixel-pusher headless></pixel-pusher>`, container)
      const el = container.querySelector('pixel-pusher') as PixelPusher
      await el.updateComplete

      const url = 'https://cdn.example.com/assets/foo%20bar.png'
      let fileSelectedDetail: File | undefined
      el.addEventListener('file-selected', (e) => {
        fileSelectedDetail = (e as CustomEvent<File>).detail
      })

      const imageEdited = new Promise<CustomEvent<{ file: File }>>((resolve) => {
        el.addEventListener(
          'image-edited',
          (e) => resolve(e as CustomEvent<{ file: File }>),
          { once: true },
        )
      })

      await el.selectURL(url)

      expect(fetchSpy).toHaveBeenCalledWith(url)
      expect(fileSelectedDetail?.name).toBe('foo bar.png')

      const edited = await imageEdited
      expect(edited.detail.file).toBeInstanceOf(File)
    })

    it('selectURL rejects when fetch response is not ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 404, statusText: 'Not Found' }),
      )

      render(html`<pixel-pusher headless></pixel-pusher>`, container)
      const el = container.querySelector('pixel-pusher') as PixelPusher
      await el.updateComplete

      await expect(el.selectURL('https://example.com/missing.png')).rejects.toThrow(
        'Failed to fetch URL',
      )
    })
  })
})
