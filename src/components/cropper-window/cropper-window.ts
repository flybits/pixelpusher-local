import { LitElement, html, unsafeCSS } from 'lit'
import { customElement } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import Cropper from 'cropperjs'
import { resizeCanvas } from '@/utils/canvas.ts'
import elementStyles from './cropper-window.scss?inline'
import { ModalWindow } from '@/components/modal-window/modal-window.ts'

export type CroppedImageEvent = CustomEvent<{ blob: Blob, file: File }>

export type CropOptions = {
  aspectRatio: number
  maxWidth: number
  maxHeight: number
  quality: number
}

@customElement('cropper-window')
export class CropperWindow extends LitElement {
  private modalWindowRef = createRef<ModalWindow>()
  private cropperWrapperRef = createRef<HTMLDivElement>()
  private cropper: Cropper | null = null;

  private cropOpts: CropOptions | null = null;
  private file: File | null = null;
  private img: HTMLImageElement | null = null;

  open(file: File, cropOptions: CropOptions) {
    this.file = file;
    this.cropOpts = cropOptions;
    this.modalWindowRef.value?.open();
    console.log('open', this.file, this.cropOpts)

    if(file){
      this.img = new Image();
      this.img.src = URL.createObjectURL(file);
      this.img.onload = () => {
        if (this.img) this.initCropper(this.img)
      }
      this.img.onerror = () => {
        console.error('image load error')
      }
    } else{
      console.error('no file provided');
    }
  }

  close() {
    this.modalWindowRef.value?.close();
    this._resetState();
  }

  private _resetState() {
    this.cropper?.destroy();
    this.cropper = null;
    this.file = null;
    this.cropOpts = null;
    this.img = null;
  }
  
  private _onModalClose() {
    this._resetState();
  }

  private initCropper(img: HTMLImageElement) {
    if(this.cropperWrapperRef.value){

      this.cropper = new Cropper(img, {
        container: this.cropperWrapperRef.value,
      });

      const cropSelection = this.cropper.getCropperSelection()
      if (cropSelection && this.cropOpts?.aspectRatio) {
        cropSelection.aspectRatio = this.cropOpts.aspectRatio
      }
    }
  }

  private async _onCrop() {
    if (!this.cropper) return;
  
    const selection = this.cropper.getCropperSelection();
    if (!selection) return;
    const sourceFile = this.file
    if (!sourceFile) return

    let canvas = await selection.$toCanvas()
    const resized = resizeCanvas(
      canvas,
      this.cropOpts?.maxWidth ?? 0,
      this.cropOpts?.maxHeight ?? 0
    )
    if (!resized) return
    canvas = resized

    const quality = this.cropOpts?.quality || 1;
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], sourceFile.name, { type: sourceFile.type })
        this._emitEvt('image-cropped', { blob, file })
        this.close()
      },
      sourceFile.type,
      quality
    )
  }

  private _emitEvt<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { 
      detail,
      bubbles: true,
      composed: true
    }))
  }

  render() {
    return html`
      <modal-window 
        ${ref(this.modalWindowRef)}
        title="Crop Image"
        @modal-close=${this._onModalClose}
      >
        <div class="crop-window-body">
          <div class="cropper-wrapper" ${ref(this.cropperWrapperRef)}></div>
        </div>
        <div class="crop-window-footer" slot="footer">
          <button class="crop-footer-btn ghost cancel" @click=${this.close}>Cancel</button>
          <button class="crop-footer-btn primary crop" @click=${this._onCrop}>Crop</button>
        </div>
      </modal-window>
    `
  }

  static styles = unsafeCSS(elementStyles)
}

declare global {
  interface HTMLElementTagNameMap {
    'cropper-window': CropperWindow
  }

  interface HTMLElementEventMap {
    'image-cropped': CroppedImageEvent
  }
}