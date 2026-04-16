import { LitElement, html, unsafeCSS } from 'lit'
import { createRef, ref } from 'lit/directives/ref.js'
import { customElement, property } from 'lit/decorators.js'
import uploadIcon from './assets/upload.svg'
import elementStyles from './pixel-pusher.scss?inline'

import { pickFile } from './utils/file'
import { CropperWindow } from '@/components/cropper-window/cropper-window.ts'

export type PixelPusherFileSelectEvent = CustomEvent<File>

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('pixel-pusher')
export class PixelPusher extends LitElement {
  private cropperWindowRef = createRef<CropperWindow>()
  
  /**
   * Image aspect ratio in decimal format (width / height)
   */
  @property({ type: Number, attribute: 'aspect-ratio' })
  aspectRatio = 0;

  /**
   * Maximum width of the image in pixels
   */
  @property({ type: Number })
  maxWidth = 0;

  /**
   * Maximum height of the image in pixels
   */
  @property({ type: Number })
  maxHeight = 0;

  /**
   * Quality of the image in decimal format (0.0 to 1.0)
   */
  @property({ type: Number })
  quality = 0.92;

  openFilePicker() {
    pickFile({
      accept: 'image/*',
      multiple: false
    }).then((files) => {
      const file = files?.[0];
      console.log('file', file)
      if(file){
        this._emitEvt('file-selected', file);

        if(this.aspectRatio > 0){
          this.cropperWindowRef.value?.open(file, {
            aspectRatio: this.aspectRatio
          });
        }
        // const tmpURL = URL.createObjectURL(file);
        // console.log('tmpURL', tmpURL)
        // const img = new Image();
        // img.src = tmpURL;
        // img.onload = () => {
        //   console.log('img', img)
        // }
        // img.onerror = (error: Event) => {
        //   console.error('error', error)
        // }
      }
    }).catch((error) => {
      console.error(error)
    })
  }

  private _emitEvt<T>(name: string, detail: T) {
    this.dispatchEvent(new CustomEvent(name, { 
      detail,
      bubbles: true,
      composed: true
    }))
  }

  render() {
    return html`
      <div class="pixel-pusher">
        <div class="trigger-area" @click=${this.openFilePicker}>
          <slot>
            <div class="upload-area">
              <img class="upload-icon" src=${uploadIcon} alt="Pixel Pusher" />
            </div>
          </slot>
        </div>
        <cropper-window 
          ${ref(this.cropperWindowRef)}
          title="Crop Image" 
        />
      </div>
    `
  }

  static styles = unsafeCSS(elementStyles)
}

declare global {
  interface HTMLElementTagNameMap {
    'pixel-pusher': PixelPusher
  }

  interface HTMLElementEventMap {
    'file-selected': CustomEvent<File>
  }
}
