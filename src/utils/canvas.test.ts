import { describe, it, expect } from 'vitest'
import {
  applyRasterTransforms,
  cloneCanvas,
  downScaleDimensions,
  resizeCanvas,
} from './canvas.ts'

describe('downScaleDimensions', () => {
  it('does not upscale beyond input dimensions', () => {
    const { width, height } = downScaleDimensions(100, 50, 200, 200)
    expect(width).toBe(100)
    expect(height).toBe(50)
  })

  it('scales down to fit within max width and height', () => {
    const { width, height } = downScaleDimensions(200, 100, 100, 100)
    expect(width).toBe(100)
    expect(height).toBe(50)
  })

  it('treats maxWidth 0 as unbounded width', () => {
    const { width, height } = downScaleDimensions(400, 100, 0, 50)
    expect(height).toBe(50)
    expect(width).toBe(200)
  })

  it('treats maxHeight 0 as unbounded height', () => {
    const { width, height } = downScaleDimensions(100, 400, 50, 0)
    expect(width).toBe(50)
    expect(height).toBe(200)
  })

  it('enforces minimum 1x1', () => {
    const { width, height } = downScaleDimensions(1, 1, 0, 0)
    expect(width).toBe(1)
    expect(height).toBe(1)
  })
})

describe('cloneCanvas', () => {
  it('copies dimensions and pixel data', () => {
    const src = document.createElement('canvas')
    src.width = 2
    src.height = 2
    const ctx = src.getContext('2d')
    expect(ctx).toBeTruthy()
    ctx!.fillStyle = '#ff0000'
    ctx!.fillRect(0, 0, 1, 1)

    const out = cloneCanvas(src)
    expect(out).toBeTruthy()
    expect(out!.width).toBe(2)
    expect(out!.height).toBe(2)
    const octx = out!.getContext('2d')!
    const p = octx.getImageData(0, 0, 1, 1).data
    expect(p[0]).toBe(255)
    expect(p[1]).toBe(0)
    expect(p[3]).toBe(255)
  })
})

describe('resizeCanvas', () => {
  it('downscales to target bounds', () => {
    const src = document.createElement('canvas')
    src.width = 100
    src.height = 50
    const ctx = src.getContext('2d')!
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(0, 0, 100, 50)

    const out = resizeCanvas(src, 50, 50)
    expect(out).toBeTruthy()
    expect(out!.width).toBe(50)
    expect(out!.height).toBe(25)
  })
})

describe('applyRasterTransforms', () => {
  it('returns the same reference when no rotation or filters apply', () => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 4
    const out = applyRasterTransforms(c, {})
    expect(out).toBe(c)
  })

  it('applies 180° rotation deterministically for a 2x1 pattern', () => {
    const c = document.createElement('canvas')
    c.width = 2
    c.height = 1
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#010203'
    ctx.fillRect(0, 0, 1, 1)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(1, 0, 1, 1)

    const out = applyRasterTransforms(c, { rotationDeg: 180 })
    expect(out).toBeTruthy()
    expect(out!.width).toBe(2)
    expect(out!.height).toBe(1)
    const d = out!.getContext('2d')!.getImageData(0, 0, 2, 1).data
    expect(Array.from(d.slice(0, 4))).toEqual([255, 255, 255, 255])
    expect(Array.from(d.slice(4, 8))).toEqual([1, 2, 3, 255])
  })

  it('swaps dimensions for 90° rotation', () => {
    const c = document.createElement('canvas')
    c.width = 3
    c.height = 2
    c.getContext('2d')!.fillRect(0, 0, 3, 2)
    const out = applyRasterTransforms(c, { rotationDeg: 90 })
    expect(out).toBeTruthy()
    expect(out!.width).toBe(2)
    expect(out!.height).toBe(3)
  })

  it('uses arbitrary-angle rotation path (non-cardinal)', () => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 4
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 4, 4)

    const out = applyRasterTransforms(c, { rotationDeg: 45 })
    expect(out).toBeTruthy()
    expect(out).not.toBe(c)
    expect(out!.width).not.toBe(c.width)
    expect(out!.height).not.toBe(c.height)
  })
})
