import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { html, nothing, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CropperImage, CropperSelection } from 'cropperjs'

import Deferred from '@/models/deferred.ts'
import './cropper-window.ts'
import type { CropperWindow } from './cropper-window.ts'

const nodeCanvasImage = globalThis.Image
const cropperStyles = readFileSync(
  join(process.cwd(), 'src/components/cropper-window/cropper-window.scss'),
  'utf8',
)

/**
 * Cropper.js listens for `load` on `new Image()`. node-canvas `Image` has `onload`
 * but no `addEventListener`, so these tests install an element that finishes loading.
 */
function installLoadingImage() {
  const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
  globalThis.Image = function LoadingImage(this: HTMLImageElement) {
    const img = document.createElement('img')
    let loadedSrc = ''
    const finishLoad = () => {
      Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 1200 })
      Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 800 })
      queueMicrotask(() => {
        img.dispatchEvent(new Event('load'))
        img.onload?.(new Event('load'))
      })
    }
    const applySrc = (value: string) => {
      if (value === loadedSrc) return
      loadedSrc = value
      srcDescriptor?.set?.call(img, value)
      finishLoad()
    }
    Object.defineProperty(img, 'src', {
      configurable: true,
      get() {
        return srcDescriptor?.get?.call(img) ?? ''
      },
      set: applySrc,
    })
    const setAttribute = img.setAttribute.bind(img)
    img.setAttribute = (name: string, value: string) => {
      setAttribute(name, value)
      if (name === 'src') applySrc(value)
    }
    return img
  } as unknown as typeof Image
}


function openCropper(el: CropperWindow, aspectRatio: number) {
  const deferred = new Deferred<HTMLCanvasElement>()
  el.open(new File(['photo'], 'photo.png', { type: 'image/png' }), { aspectRatio }, deferred)
  return deferred
}

describe('cropper-window', () => {
  let container: HTMLDivElement
  let onResize: ResizeObserverCallback | null
  let imageCenter: ReturnType<typeof vi.spyOn>
  let selectionCenter: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    onResize = null
    installLoadingImage()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 800, 600),
    )
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
    imageCenter = vi.spyOn(CropperImage.prototype, '$center')
    selectionCenter = vi.spyOn(CropperSelection.prototype, '$center')
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          onResize = callback
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )

    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    const el = container.querySelector('cropper-window') as CropperWindow | null
    el?.close()
    render(nothing, container)
    container.remove()
    globalThis.Image = nodeCanvasImage
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function containCalls(): number {
    return imageCenter.mock.calls.filter((call) => call[0] === 'contain').length
  }

  async function renderWindow(): Promise<CropperWindow> {
    render(html`<cropper-window></cropper-window>`, container)
    const el = container.querySelector('cropper-window') as CropperWindow
    await el.updateComplete
    return el
  }

  it('keeps a fixed 800 by 600 stage and bounds it with max-width and max-height', () => {
    const css = cropperStyles

    expect(css).toMatch(/\.crop-window-body\s*\{[^}]*width:\s*800px/)
    expect(css).toMatch(/\.crop-window-body\s*\{[^}]*height:\s*600px/)
    expect(css).toMatch(/\.crop-window-body\s*\{[^}]*max-width:\s*100%/)
    expect(css).toMatch(/\.crop-window-body\s*\{[^}]*max-height:\s*100%/)
    expect(css).toMatch(/\.crop-window-body\s*\{[^}]*min-height:\s*0/)
    expect(css).not.toMatch(/width:\s*min\(/)
    expect(css).not.toMatch(/height:\s*min\(/)
  })

  it('makes the cropper canvas fill the wrapper', () => {
    const css = cropperStyles

    expect(css).toMatch(/\.cropper-wrapper\s*\{[^}]*width:\s*100%/)
    expect(css).toMatch(/\.cropper-wrapper\s*\{[^}]*height:\s*100%/)
    expect(css).toMatch(/cropper-canvas\s*\{[^}]*width:\s*100%/)
    expect(css).toMatch(/cropper-canvas\s*\{[^}]*height:\s*100%/)
  })

  it('mounts a scale-and-pan template with the aspect ratio set before layout', async () => {
    const el = await renderWindow()
    openCropper(el, 1.5)

    const canvas = await vi.waitFor(() => {
      const found = el.shadowRoot?.querySelector('cropper-canvas')
      expect(found).toBeTruthy()
      return found!
    })
    const image = canvas.querySelector('cropper-image')
    const selection = canvas.querySelector('cropper-selection')
    const canvasHandles = [...canvas.children].filter((node) => node.localName === 'cropper-handle')

    expect(image?.hasAttribute('scalable')).toBe(true)
    expect(image?.hasAttribute('translatable')).toBe(true)
    expect(image?.getAttribute('initial-fit')).toBe('contain')
    expect(image?.hasAttribute('rotatable')).toBe(false)
    expect(image?.hasAttribute('skewable')).toBe(false)
    expect(image?.hasAttribute('max-fit')).toBe(false)
    expect(image?.hasAttribute('min-fit')).toBe(false)
    expect(image?.hasAttribute('initial-center-size')).toBe(false)

    expect(canvasHandles.map((handle) => handle.getAttribute('action'))).toEqual(['move'])
    expect(canvasHandles[0]?.hasAttribute('plain')).toBe(true)
    expect(canvas.querySelector(':scope > cropper-handle[action="select"]')).toBeNull()

    expect(selection?.getAttribute('initial-aspect-ratio')).toBe('1.5')
    expect(selection?.hasAttribute('movable')).toBe(true)
    expect(selection?.hasAttribute('resizable')).toBe(true)
    expect(selection?.hasAttribute('zoomable')).toBe(false)
    expect(selection?.querySelector('cropper-handle[action="move"]')).toBeTruthy()
    expect(selection?.querySelectorAll('cropper-handle[action$="-resize"]')).toHaveLength(8)
  })

  it('leaves the aspect ratio unset when it is not positive', async () => {
    const el = await renderWindow()
    openCropper(el, 0)

    const selection = await vi.waitFor(() => {
      const found = el.shadowRoot?.querySelector('cropper-selection')
      expect(found).toBeTruthy()
      return found!
    })

    expect(selection.hasAttribute('initial-aspect-ratio')).toBe(false)
  })

  it('contains the image and centers the selection once the image is ready', async () => {
    const el = await renderWindow()
    openCropper(el, 1)

    await vi.waitFor(() => {
      expect(containCalls()).toBeGreaterThanOrEqual(2)
      expect(selectionCenter).toHaveBeenCalled()
    })
  })

  it('refits the image on resize and does not recenter the selection again', async () => {
    const el = await renderWindow()
    openCropper(el, 1)

    await vi.waitFor(() => {
      expect(containCalls()).toBeGreaterThanOrEqual(2)
      expect(selectionCenter).toHaveBeenCalled()
    })
    await new Promise((resolve) => setTimeout(resolve, 0))

    onResize?.([], {} as ResizeObserver)
    const containAfterFirstResize = containCalls()
    const selectionAfterFirstResize = selectionCenter.mock.calls.length

    onResize?.([], {} as ResizeObserver)

    expect(containCalls()).toBe(containAfterFirstResize + 1)
    expect(selectionCenter).toHaveBeenCalledTimes(selectionAfterFirstResize)
  })
})
