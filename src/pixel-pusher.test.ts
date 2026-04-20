import { html, nothing, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import './pixel-pusher.ts'
import type { PixelPusher } from './pixel-pusher.ts'

describe('pixel-pusher', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
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
})
