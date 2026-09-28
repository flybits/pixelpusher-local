export type CropExportMode = 'source' | 'selection'

export type CropSelectionLike = {
  width: number
  height: number
}

export type CropperImageLike = {
  $ready(): Promise<HTMLImageElement>
  getBoundingClientRect(): DOMRect
}

export type CropExportMetrics = {
  selectionWidth: number
  selectionHeight: number
  naturalWidth: number
  naturalHeight: number
  displayedWidth: number
  displayedHeight: number
  mode: CropExportMode
}

/**
 * Pure crop-export width from layout + natural metrics (unit-testable).
 * Returns `undefined` for selection mode (legacy layout-pixel export).
 */
export function computeCropExportWidthFromMetrics(
  metrics: CropExportMetrics,
): number | undefined {
  const {
    selectionWidth,
    naturalWidth,
    displayedWidth,
    mode,
  } = metrics

  if (mode === 'selection') {
    return undefined
  }

  if (
    selectionWidth <= 0 ||
    naturalWidth <= 0 ||
    displayedWidth <= 0
  ) {
    return undefined
  }

  const scale = naturalWidth / displayedWidth
  const computed = Math.max(1, Math.round(selectionWidth * scale))
  const naturalCropWidth = Math.max(
    1,
    Math.round((selectionWidth / displayedWidth) * naturalWidth),
  )

  return Math.min(computed, naturalCropWidth)
}

export async function resolveCropExportWidth(
  selection: CropSelectionLike,
  cropperImage: CropperImageLike | null,
  mode: CropExportMode = 'source',
): Promise<number | undefined> {
  if (mode === 'selection' || !cropperImage) {
    return undefined
  }

  const image = await cropperImage.$ready()
  const naturalWidth = image.naturalWidth
  if (naturalWidth <= 0) {
    return undefined
  }

  const { width: displayedWidth, height: displayedHeight } =
    cropperImage.getBoundingClientRect()
  if (displayedWidth <= 0 || displayedHeight <= 0) {
    return undefined
  }

  return computeCropExportWidthFromMetrics({
    selectionWidth: selection.width,
    selectionHeight: selection.height,
    naturalWidth,
    naturalHeight: image.naturalHeight,
    displayedWidth,
    displayedHeight,
    mode: 'source',
  })
}
