import Deferred from "@/models/deferred.ts";

export const downScaleDimensions = (
  inputWidth: number, 
  inputHeight: number, 
  maxWidth: number, 
  maxHeight: number
) => {
  const maxW = maxWidth > 0 ? maxWidth : Infinity
  const maxH = maxHeight > 0 ? maxHeight : Infinity
  // Downscale only: never scale above 1; cap by max dimensions
  const scale = Math.min(1, maxW / inputWidth, maxH / inputHeight)
  const outputWidth = Math.max(1, Math.round(inputWidth * scale))
  const outputHeight = Math.max(1, Math.round(inputHeight * scale))
  return { width: outputWidth, height: outputHeight };
}

export const cloneCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(canvas, 0, 0);
  return outputCanvas;
}

export const resizeCanvas = (
  canvas: HTMLCanvasElement, 
  maxWidth: number, 
  maxHeight: number
): HTMLCanvasElement | undefined => {
  const outputCanvas = document.createElement('canvas');
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) return;
  
  const { width, height } = downScaleDimensions(canvas.width, canvas.height, maxWidth, maxHeight);
  outputCanvas.width = width;
  outputCanvas.height = height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);
  
  return outputCanvas;
}

export const canvasFromFile = async (file: File): Promise<HTMLCanvasElement> => {
  const deferred = new Deferred<HTMLCanvasElement>();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0);
    deferred.resolve(canvas)
  }
  img.onerror = () => {
    deferred.reject(new Error('Failed to load image'))
  }

  return deferred.promise;
}

export type RasterTransformOptions = {
  rotationDeg?: number
  blurPx?: number
  grayscale?: boolean
  brightness?: number
  contrast?: number
}

function normalizeAngleDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function applyRasterTransforms(
  source: HTMLCanvasElement,
  opts: RasterTransformOptions
): HTMLCanvasElement | undefined {
  const rotationDeg = normalizeAngleDeg(opts.rotationDeg ?? 0)
  const blurPx = Math.max(0, opts.blurPx ?? 0)
  const grayscale = opts.grayscale ?? false
  const brightness = opts.brightness ?? 0
  const contrast = opts.contrast ?? 0

  const w = source.width
  const h = source.height
  const rad = (rotationDeg * Math.PI) / 180

  const needsRotate = rotationDeg % 360 !== 0
  const needsFilter = blurPx > 0 || grayscale || brightness !== 0 || contrast !== 0

  if (!needsRotate && !needsFilter) {
    return source
  }

  const filterParts: string[] = []
  if (grayscale) filterParts.push('grayscale(1)')
  if (blurPx > 0) filterParts.push(`blur(${blurPx}px)`)
  if (brightness !== 0) filterParts.push(`brightness(${brightness})`)
  if (contrast !== 0) filterParts.push(`contrast(${contrast})`)
  const filter = filterParts.join(' ')

  if (!needsRotate) {
    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    const ctx = out.getContext('2d')
    if (!ctx) return undefined
    ctx.filter = filter
    ctx.drawImage(source, 0, 0)
    return out
  }

  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const outW = Math.max(1, Math.ceil(w * cos + h * sin))
  const outH = Math.max(1, Math.ceil(w * sin + h * cos))

  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const ctx = out.getContext('2d')
  if (!ctx) return undefined

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.filter = filter

  ctx.translate(outW / 2, outH / 2)
  ctx.rotate(rad)
  ctx.drawImage(source, -w / 2, -h / 2)

  return out
}