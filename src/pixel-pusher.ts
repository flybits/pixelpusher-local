import { LitElement, html, unsafeCSS } from 'lit'
import { createRef, ref } from 'lit/directives/ref.js'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'

import Deferred from './models/deferred';
import uploadIcon from './assets/upload.svg'
import elementStyles from './pixel-pusher.scss?inline'
import { applyFileExtension, pickFile } from './utils/file'
import { canvasFromFile, resizeCanvas } from './utils/canvas'
import { CropperWindow } from '@/components/cropper-window/cropper-window.ts'
import { FilterWindow } from '@/components/filter-window/filter-window.ts'
import { RangeInput } from '@/components/range-input/range-input.ts'
import { ToggleSwitch } from '@/components/toggle-switch/toggle-switch.ts'
import { ModalWindow } from '@/components/modal-window/modal-window.ts'

export { CropperWindow } from '@/components/cropper-window/cropper-window.ts'
export { FilterWindow } from '@/components/filter-window/filter-window.ts'
export { RangeInput } from '@/components/range-input/range-input.ts'
export { ToggleSwitch } from '@/components/toggle-switch/toggle-switch.ts'
export { ModalWindow } from '@/components/modal-window/modal-window.ts'

export type PixelPusherFileSelectEvent = CustomEvent<File>
export type PixelPusherImageEditedEvent = CustomEvent<{ 
  canvas: HTMLCanvasElement, 
  blob: Blob, 
  file: File 
}>

const hasInvalidFileTypes = (files: File[]) => {
  return files.some(file => !file.type.startsWith('image/'));
}

/**
 * Image file picker with optional cropping. Clicking opens a file dialog; when
 * `aspectRatio` is set, the crop modal opens before emitting the result.
 *
 * @slot - Optional light DOM for the clickable area. Without slotted children, a default upload and preview UI is used. Mark elements with `data-pp-preview` to receive the cropped image preview.
 */
@customElement('pixel-pusher')
export class PixelPusher extends LitElement {
  private cropperWindowRef = createRef<CropperWindow>()
  private filterWindowRef = createRef<FilterWindow>()
  
  /**
   * Image aspect ratio in decimal format (width / height)
   */
  @property({ type: Number, attribute: 'aspect-ratio' })
  aspectRatio = 0;

  /**
   * Blur amount in pixels
   */
  @property({ type: Number, attribute: 'blur' })
  blurPx = 0;

  /**
   * Rotation amount in degrees
   */
  @property({ type: Number, attribute: 'rotate' })
  rotateDeg = 0;

  /**
   * Whether to apply grayscale filter
   */
  @property({ type: Boolean, attribute: 'grayscale' })
  grayscale = false;

  /**
   * Brightness amount in percentage
   */
  @property({ type: Number, attribute: 'brightness' })
  brightness = 50;

  /**
   * Contrast amount in percentage
   */
  @property({ type: Number, attribute: 'contrast' })
  contrast = 50;

  /**
   * Maximum width of the image in pixels
   */
  @property({ type: Number, attribute: 'max-width' })
  maxWidth = 0;

  /**
   * Maximum height of the image in pixels
   */
  @property({ type: Number, attribute: 'max-height' })
  maxHeight = 0;

  /**
   * Quality of the image in decimal format (0.0 to 1.0)
   */
  @property({ type: Number, attribute: 'quality' })
  quality;

  /**
   * Whether to show interactive filters
   */
  @property({ type: Boolean, attribute: 'interactive-filters' })
  interactiveFilters = false;

  /**
   * Title of the crop modal
   */
  @property({ type: String, attribute: 'crop-modal-title' })
  cropModalTitle = 'Crop image';
  
  /**
   * Title of the filter modal
   */
  @property({ type: String, attribute: 'filter-modal-title' })
  filterModalTitle = 'Edit image';

  private _editCanvas: HTMLCanvasElement | null = null;
  private _sourceFile: File | null = null;
  
  @state()
  private croppedPreviewURL: string | null = null;

  @property({ type: Boolean, reflect: true, attribute: 'trigger-drag-over-invalid' })
  _dragOverInvalid: boolean = false;
  
  @property({ type: Boolean, reflect: true, attribute: 'trigger-drag-over' })
  _dragOver: boolean = false;
  

  get defaultSlotContent(): HTMLElement | null {
    const defaultSlot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    return defaultSlot?.assignedElements({flatten: true})[0] as HTMLElement | null;
  }

  get hasCropConfigs(): boolean {
    return this.aspectRatio > 0;
  }

  get hasFilterConfigs(): boolean {
    return this.blurPx > 0 || this.rotateDeg > 0 || this.grayscale || this.brightness !== 50 || this.contrast !== 50;
  }

  async openFilePicker() {
    try{
      const files = await pickFile({
        accept: 'image/*',
        multiple: false
      });
  
      const file = files?.[0];
      if (file) {
        this._selectFile(file);
      }
    } catch(error){
      console.error(error)
    }
  }

  private async _selectFile(file: File) {
    console.log('file', file)
    if(file){
      this._sourceFile = file;
      this._emitEvt('file-selected', file);
      try{
        this._editCanvas = await canvasFromFile(file);
      } catch(error){
        console.error(error)
        return;
      }

      if(this.hasCropConfigs){
        const deferredCrop = new Deferred<HTMLCanvasElement>();
        this.cropperWindowRef.value?.open(file, {
          aspectRatio: this.aspectRatio,
        }, deferredCrop);

        try{
          this._editCanvas = await deferredCrop.promise;
        } catch(error){
          console.error(error)
          return;
        }
      }

      // apply filters
      if(this.hasFilterConfigs || this.interactiveFilters){
        const deferredFilter = new Deferred<HTMLCanvasElement>();
        const filterFn = this.interactiveFilters 
          ? this.filterWindowRef.value?.open 
          : this.filterWindowRef.value?.applyFilters;
        filterFn.call(
          this.filterWindowRef.value, 
          this._editCanvas, 
          {
            blur: this.blurPx,
            grayscale: this.grayscale,
            rotate: this.rotateDeg,
            brightness: this.brightness,
            contrast: this.contrast,
          },
          deferredFilter
        );

        try{
          this._editCanvas = await deferredFilter.promise;
        } catch(error){
          console.error(error)
          return;
        }
      }

      this._commitEditCanvas();
    }
  }

  private _commitEditCanvas() {
    if(this._editCanvas){
      let outputCanvas = this._editCanvas;
      if(this.maxWidth > 0 || this.maxHeight > 0){
        outputCanvas = resizeCanvas(
          this._editCanvas,
          this.maxWidth ?? 0,
          this.maxHeight ?? 0
        )
      }

      const quality = this.quality || 1;
      let resolvedType = this._sourceFile.type;
      let resolvedName = this._sourceFile.name;
      if(
        (this.quality && this._sourceFile.type !== 'image/jpeg') ||
        this._sourceFile.type === 'image/svg+xml'
      ){
        resolvedType = 'image/webp';
        resolvedName = applyFileExtension(this._sourceFile.name, resolvedType);
      }

      outputCanvas.toBlob(
        (blob) => {
          if (!blob) return

          if(this.croppedPreviewURL){
            URL.revokeObjectURL(this.croppedPreviewURL);
          }
          this.croppedPreviewURL = URL.createObjectURL(blob);
          this._updateChildPreviews();
          const file = new File([blob], resolvedName, { type: resolvedType })
          this._emitEvt('image-edited', { canvas: outputCanvas, blob, file })
        },
        resolvedType,
        quality
      )
    }
  }

  private _handleDragEvt(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if(event.type === 'dragenter' || event.type === 'dragover'){
      this._dragOver = true;
      let selectedFiles: File[] = [];
      if((event as DragEvent)?.dataTransfer?.files?.length) {
        selectedFiles = Array.from((event as DragEvent)?.dataTransfer?.files || []) as File[];
      } else if((event as DragEvent)?.dataTransfer?.items?.length) {
        selectedFiles = Array.from((event as DragEvent)?.dataTransfer?.items || []).map(item => {
          return new File([],'', { type: item.type });
        });
      }
      if(selectedFiles.length <= 0 || hasInvalidFileTypes(selectedFiles)){
        this._dragOverInvalid = true;
      }
    } else if(event.type === 'dragleave'){
      this._dragOver = false;
      this._dragOverInvalid = false;
    } else if(event.type === 'drop'){
      let selectedFiles: File[] = [];
      if((event as DragEvent)?.dataTransfer?.files?.length) {
        selectedFiles = Array.from((event as DragEvent)?.dataTransfer?.files || []) as File[];
      }
      this._dragOver = false;
      this._dragOverInvalid = false;
      if(selectedFiles?.length > 0 && !hasInvalidFileTypes(selectedFiles)){
        this._selectFile(selectedFiles[0]);
      }
    }
  }

  private _updateChildPreviews() {
    const previewUrl = this.croppedPreviewURL
    if(this.defaultSlotContent && previewUrl){
      if(this.defaultSlotContent instanceof HTMLImageElement && this.defaultSlotContent.hasAttribute('data-pp-preview')){
        this.defaultSlotContent.src = previewUrl;
      } else if(this.defaultSlotContent instanceof HTMLElement && this.defaultSlotContent.hasAttribute('data-pp-preview')){
        this.defaultSlotContent.style.backgroundImage = `url(${previewUrl})`;
      }
      
      this.defaultSlotContent.querySelectorAll('img[data-pp-preview]').forEach(img => {
        (img as HTMLImageElement).src = previewUrl;
      });
      this.defaultSlotContent.querySelectorAll('div[data-pp-preview]').forEach(div => {
        (div as HTMLElement).style.backgroundImage = `url(${previewUrl})`;
      });
    }
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
      <div class="pixel-pusher">
        <div 
          class=${classMap({
            'trigger-area': true,
            'drag-over': this._dragOver,
            'drag-over-invalid': this._dragOverInvalid
          })}
          @click=${this.openFilePicker}
          @dragenter=${this._handleDragEvt}
          @dragover=${this._handleDragEvt}
          @dragleave=${this._handleDragEvt}
          @drop=${this._handleDragEvt}
        >
          <slot>
            <div class="upload-area">
              ${
                this.croppedPreviewURL 
                  ? html`<img class="cropped-preview" src=${this.croppedPreviewURL} alt="Cropped Preview" />`
                  : html`<div class="cropped-preview-placeholder">
                      <img class="upload-icon" src=${uploadIcon} alt="Pixel Pusher" />
                    </div>`
              }
            </div>
          </slot>
        </div>

        <cropper-window 
          ${ref(this.cropperWindowRef)}
          title=${this.cropModalTitle} 
        ></cropper-window>
        <filter-window
          ${ref(this.filterWindowRef)}
          title=${this.filterModalTitle}
        ></filter-window>
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
    'file-selected': PixelPusherFileSelectEvent
    'image-edited': PixelPusherImageEditedEvent
  }
}
