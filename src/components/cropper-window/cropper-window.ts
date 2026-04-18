import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import Cropper from 'cropperjs'

import Deferred from '@/models/deferred.ts';
import elementStyles from './cropper-window.scss?inline'
import { ModalWindow } from '@/components/modal-window/modal-window.ts'

export type CroppedImageEvent = CustomEvent<{ canvas: HTMLCanvasElement }>

export type CropOptions = {
  aspectRatio: number
}

@customElement('cropper-window')
export class CropperWindow extends LitElement {
  private modalWindowRef = createRef<ModalWindow>()
  private cropperWrapperRef = createRef<HTMLDivElement>()
  private cropper: Cropper | null = null;

  private cropOpts: CropOptions | null = null;
  private file: File | null = null;
  private img: HTMLImageElement | null = null;
  private _deferredReq: Deferred<HTMLCanvasElement> | null = null;

  @property({ type: String, reflect: true, attribute: 'title' })
  title: string = 'Crop Image';

  open(
    file: File, 
    cropOptions: CropOptions, 
    deferredRequest: Deferred<HTMLCanvasElement>
  ) {
    this._deferredReq = deferredRequest;
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
        if(this._deferredReq){
          this._deferredReq.reject(new Error('Failed to load image'));
        }
      }
    } else{
      console.error('no file provided');
      if(this._deferredReq){
        this._deferredReq.reject(new Error('No file provided'));
      }
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

    try{
      let canvas = await selection.$toCanvas()
      if(this._deferredReq){
        this._deferredReq.resolve(canvas);
      }
      this._emitEvt('image-cropped', { canvas })
      this.close();
    } catch(error){
      console.error(error)
      if(this._deferredReq){
        this._deferredReq.reject(error);
      }
    }
  }

  private _emitEvt<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { 
      detail,
      bubbles: false,
      composed: false
    }))
  }

  render() {
    return html`
      <modal-window 
        ${ref(this.modalWindowRef)}
        title=${this.title}
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