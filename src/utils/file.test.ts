import { describe, it, expect } from 'vitest'
import { applyFileExtension } from './file.ts'

describe('applyFileExtension', () => {
  it('replaces extension using mime subtype', () => {
    expect(applyFileExtension('photo.jpg', 'image/webp')).toBe('photo.webp')
  })

  it('uses first dot segment as basename', () => {
    expect(applyFileExtension('a.b.c.png', 'image/jpeg')).toBe('a.jpeg')
  })

  it('handles filename without extension', () => {
    expect(applyFileExtension('untitled', 'image/png')).toBe('untitled.png')
  })
})
