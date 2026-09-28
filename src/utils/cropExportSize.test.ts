import { describe, expect, it } from 'vitest'
import { downScaleDimensions } from './canvas.ts'
import {
  computeCropExportWidthFromMetrics,
  type CropExportMetrics,
} from './cropExportSize.ts'

function metrics(
  partial: Partial<CropExportMetrics> & Pick<CropExportMetrics, 'mode'>,
): CropExportMetrics {
  return {
    selectionWidth: 400,
    selectionHeight: 517,
    naturalWidth: 3000,
    naturalHeight: 4000,
    displayedWidth: 600,
    displayedHeight: 800,
    ...partial,
  }
}

describe('computeCropExportWidthFromMetrics', () => {
  it('maps layout selection to source-relative width in source mode', () => {
    const width = computeCropExportWidthFromMetrics(metrics({ mode: 'source' }))
    expect(width).toBe(2000)
  })

  it('returns undefined in selection mode', () => {
    expect(
      computeCropExportWidthFromMetrics(metrics({ mode: 'selection' })),
    ).toBeUndefined()
  })

  it('does not upscale when displayed width exceeds natural width', () => {
    const width = computeCropExportWidthFromMetrics(
      metrics({
        mode: 'source',
        naturalWidth: 800,
        naturalHeight: 1066,
        displayedWidth: 1200,
        displayedHeight: 1600,
        selectionWidth: 400,
      }),
    )
    expect(width).toBeLessThanOrEqual(
      Math.round((400 / 1200) * 800),
    )
    expect(width).toBe(267)
  })

  describe('composition with existing max-width / max-height downscale', () => {
    const cropWidth = 2000
    const cropHeight = 2585

    it('leaves crop export unchanged when max bounds are 0', () => {
      const { width, height } = downScaleDimensions(
        cropWidth,
        cropHeight,
        0,
        0,
      )
      expect(width).toBe(2000)
      expect(height).toBe(2585)
    })

    it('downscales high-res crop export via maxWidth', () => {
      const { width, height } = downScaleDimensions(
        cropWidth,
        cropHeight,
        800,
        0,
      )
      expect(width).toBe(800)
      expect(height).toBe(1034)
    })

    it('does not upscale when max bounds exceed crop export', () => {
      const { width, height } = downScaleDimensions(
        1024,
        1326,
        4096,
        4096,
      )
      expect(width).toBe(1024)
      expect(height).toBe(1326)
    })
  })
})
