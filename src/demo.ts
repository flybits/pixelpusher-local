import { PixelPusher } from './pixel-pusher'
import sampleImageUrl from './assets/undo.png?url'

function fileLine(file: File): string {
  return `${file.name} · ${file.type || 'no type'} · ${file.size} bytes`
}

function setupOutput(
  pusherId: string,
  outputId: string,
  mode: 'crop' | 'nocrop'
): void {
  const el = document.getElementById(pusherId)
  const out = document.getElementById(outputId)
  if (!el || !out) return

  el.addEventListener('file-selected', (e: Event) => {
    const file = (e as CustomEvent<File>).detail
    let text = `file-selected\n${fileLine(file)}`
    if (mode === 'nocrop') {
      text += '\n\nCrop modal: skipped (aspect-ratio is 0).'
    }
    out.textContent = text
  })

  el.addEventListener('image-edited', (e: Event) => {
    const { blob, file } = (e as CustomEvent<{ blob: Blob; file: File }>).detail
    const base = out.textContent || ''
    out.textContent =
      `${base}\n\nimage-edited\n${fileLine(file)}\nblob: ${blob.size} bytes`
  })
}

function setupProgrammaticDemo(): void {
  const pusher = document.getElementById('demo-programmatic') as PixelPusher | null
  const out = document.getElementById('demo-programmatic-events')
  const fileInput = document.getElementById('demo-programmatic-file') as HTMLInputElement | null
  const fileBtn = document.getElementById('demo-programmatic-file-btn')
  const urlInput = document.getElementById('demo-programmatic-url') as HTMLInputElement | null
  const urlBtn = document.getElementById('demo-programmatic-url-btn')
  const sampleBtn = document.getElementById('demo-programmatic-sample-btn')

  if (!pusher || !out || !fileInput || !fileBtn || !urlInput || !urlBtn || !sampleBtn) return

  const appendError = (message: string): void => {
    out.textContent = `${out.textContent || ''}\n\n${message}`.trim()
  }

  fileBtn.addEventListener('click', () => {
    fileInput.click()
  })

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (!file) return
    try {
      await pusher.selectFile(file)
    } catch (err) {
      appendError(err instanceof Error ? err.message : String(err))
    }
  })

  urlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim()
    if (!url) {
      appendError('Enter an image URL, or use Load sample.')
      return
    }
    try {
      await pusher.selectURL(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      appendError(`selectURL failed: ${message}`)
    }
  })

  sampleBtn.addEventListener('click', async () => {
    try {
      await pusher.selectURL(sampleImageUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      appendError(`selectURL failed: ${message}`)
    }
  })
}

setupOutput('demo-default', 'demo-a-events', 'crop')
setupOutput('demo-slotted', 'demo-b-events', 'crop')
setupOutput('demo-interactive-filters', 'demo-d-events', 'crop')
setupOutput('demo-declarative-filters', 'demo-e-events', 'crop')
setupOutput('demo-quality', 'demo-f-events', 'crop')
setupOutput('demo-no-crop', 'demo-c-events', 'nocrop')
setupOutput('demo-programmatic', 'demo-programmatic-events', 'nocrop')
setupProgrammaticDemo()
