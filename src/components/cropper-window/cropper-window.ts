import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import Cropper from 'cropperjs'

import Deferred from '@/models/deferred.ts';
import elementStyles from './cropper-window.scss?inline'
import { ModalWindow } from '@/components/modal-window/modal-window.ts'
import {
  resolveCropExportWidth,
  type CropExportMode,
} from '@/utils/cropExportSize.ts'

export type CroppedImageEvent = CustomEvent<{ canvas: HTMLCanvasElement }>

export type CropOptions = {
  aspectRatio: number
  cropExportMode?: CropExportMode
}

function cropperTemplate(aspectRatio?: number): string {
  const ratioAttr = aspectRatio !== undefined && Number.isFinite(aspectRatio) && aspectRatio > 0
    ? ` initial-aspect-ratio="${aspectRatio}"`
    : ''

  return `<cropper-canvas background>
    <cropper-image scalable translatable initial-fit="contain"></cropper-image>
    <cropper-shade hidden></cropper-shade>
    <cropper-handle action="move" plain></cropper-handle>
    <cropper-selection initial-coverage="0.5" movable resizable${ratioAttr}>
      <cropper-grid role="grid" bordered covered></cropper-grid>
      <cropper-crosshair centered></cropper-crosshair>
      <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
      <cropper-handle action="n-resize"></cropper-handle>
      <cropper-handle action="e-resize"></cropper-handle>
      <cropper-handle action="s-resize"></cropper-handle>
      <cropper-handle action="w-resize"></cropper-handle>
      <cropper-handle action="ne-resize"></cropper-handle>
      <cropper-handle action="nw-resize"></cropper-handle>
      <cropper-handle action="se-resize"></cropper-handle>
      <cropper-handle action="sw-resize"></cropper-handle>
    </cropper-selection>
  </cropper-canvas>`
}

@customElement('cropper-window')
export class CropperWindow extends LitElement {
  private modalWindowRef = createRef<ModalWindow>()
  private cropperWrapperRef = createRef<HTMLDivElement>()
  private cropper: Cropper | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private imageReady = false;
  private selectionCentered = false;

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
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.imageReady = false;
    this.selectionCentered = false;
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
    const wrapper = this.cropperWrapperRef.value
    if (!wrapper) return

    this.resizeObserver?.disconnect()
    this.cropper?.destroy()
    this.imageReady = false
    this.selectionCentered = false

    this.cropper = new Cropper(img, {
      container: wrapper,
      template: cropperTemplate(this.cropOpts?.aspectRatio),
    })

    void this._layoutCropper()

    this.resizeObserver = new ResizeObserver(() => {
      this._fitImage()
    })
    this.resizeObserver.observe(wrapper)
  }

  private async _layoutCropper() {
    const cropper = this.cropper
    const image = cropper?.getCropperImage()
    if (!cropper || !image) return

    try {
      await image.$ready()
    } catch {
      return
    }
    if (this.cropper !== cropper) return
    this.imageReady = true

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
    if (this.cropper !== cropper) return

    this._fitImage()
  }

  private _fitImage() {
    if (!this.imageReady) return
    const wrapper = this.cropperWrapperRef.value
    const image = this.cropper?.getCropperImage()
    if (!wrapper || !image || wrapper.clientWidth === 0 || wrapper.clientHeight === 0) return
    const rect = image.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    image.$center('contain')
    if (!this.selectionCentered) {
      this.cropper?.getCropperSelection()?.$center()
      this.selectionCentered = true
    }
  }

  private async _onCrop() {
    if (!this.cropper) return;
  
    const selection = this.cropper.getCropperSelection();
    if (!selection) return;
    const sourceFile = this.file
    if (!sourceFile) return

    try{
      const cropperImage = this.cropper.getCropperImage()
      const exportWidth = await resolveCropExportWidth(
        selection,
        cropperImage,
        this.cropOpts?.cropExportMode ?? 'source',
      )
      const canvas = exportWidth
        ? await selection.$toCanvas({ width: exportWidth })
        : await selection.$toCanvas()
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