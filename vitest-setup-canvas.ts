/**
 * happy-dom does not implement Canvas 2D. Patch `document.createElement('canvas')`
 * and `Image` so canvas utilities under test use node-canvas (real Cairo backend).
 */
import { Canvas, Image as NodeImage } from 'canvas'

const origCreate = document.createElement.bind(document)

document.createElement = ((tagName: string, options?: unknown) => {
  if (String(tagName).toLowerCase() === 'canvas') {
    const c = new Canvas(300, 150)
    return c as unknown as HTMLCanvasElement
  }
  return origCreate(tagName as keyof HTMLElementTagNameMap, options as never)
}) as typeof document.createElement

globalThis.Image = NodeImage as unknown as typeof Image

/** Browser-style `toBlob` for node-canvas (used by tests). */
if (!Canvas.prototype.toBlob) {
  ;(Canvas.prototype as Canvas & { toBlob?: typeof patchToBlob }).toBlob = patchToBlob
}

function patchToBlob(
  this: Canvas,
  callback: (blob: Blob | null) => void,
  type?: string,
  quality?: number,
): void {
  const mime = type?.includes('jpeg') ? 'image/jpeg' : 'image/png'
  try {
    const buf =
      mime === 'image/jpeg'
        ? this.toBuffer('image/jpeg', { quality: quality ?? 0.92 })
        : this.toBuffer('image/png')
    const blob = new Blob([new Uint8Array(buf)], { type: mime })
    queueMicrotask(() => callback(blob))
  } catch {
    queueMicrotask(() => callback(null))
  }
}
