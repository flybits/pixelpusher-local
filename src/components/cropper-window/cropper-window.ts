import { LitElement, html, unsafeCSS, nothing } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'
import elementStyles from './cropper-window.scss?inline'

import { ModalWindow } from '@/components/modal-window/modal-window.ts'

export type CropOptions = {
  aspectRatio: number
}

@customElement('cropper-window')
export class CropperWindow extends LitElement {
  private modalWindowRef = createRef<ModalWindow>()

  @state()
  private cropOpts: CropOptions | null = null;
  
  @state() 
  private file: File | null = null;

  open(file: File, cropOptions: CropOptions) {
    this.file = file;
    this.cropOpts = cropOptions;
    this.modalWindowRef.value?.open();
    console.log('open', this.file, this.cropOpts)
  }

  render() {
    return html`
      <modal-window ${ref(this.modalWindowRef)}>
        <div class="crop-window-body">
          <div class="crop-window-body-inner">
            <div class="crop-window-body-inner-inner">
              ${this.file?.name ?? 'No file selected'}
            </div>
          </div>
        </div>
      </modal-window>
    `
  }
}