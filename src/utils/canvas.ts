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

export const resizeCanvas = (canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number): HTMLCanvasElement | undefined => {
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