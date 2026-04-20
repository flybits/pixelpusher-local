import './pixel-pusher'

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

setupOutput('demo-default', 'demo-a-events', 'crop')
setupOutput('demo-slotted', 'demo-b-events', 'crop')
setupOutput('demo-interactive-filters', 'demo-d-events', 'crop')
setupOutput('demo-declarative-filters', 'demo-e-events', 'crop')
setupOutput('demo-quality', 'demo-f-events', 'crop')
setupOutput('demo-no-crop', 'demo-c-events', 'nocrop')
