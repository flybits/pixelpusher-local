import { LitElement, html, unsafeCSS } from 'lit'
import { createRef, ref } from 'lit/directives/ref.js'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import uploadIcon from './assets/upload.svg'
import elementStyles from './pixel-pusher.scss?inline'

import { pickFile } from './utils/file'
import { CropperWindow, type CroppedImageEvent } from '@/components/cropper-window/cropper-window.ts'

export { CropperWindow, type CroppedImageEvent }
export type PixelPusherFileSelectEvent = CustomEvent<File>

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
  
  /**
   * Image aspect ratio in decimal format (width / height)
   */
  @property({ type: Number, attribute: 'aspect-ratio' })
  aspectRatio = 0;

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
   * Title of the crop modal
   */
  @property({ type: String, attribute: 'crop-modal-title' })
  cropModalTitle = 'Crop Image';

  private _croppedFile: File | null = null;
  private _croppedBlob: Blob | null = null;
  
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

  private _selectFile(file: File) {
    console.log('file', file)
    if(file){
      this._emitEvt('file-selected', file);

      if(this.aspectRatio > 0){
        this.cropperWindowRef.value?.open(file, {
          aspectRatio: this.aspectRatio,
          maxWidth: this.maxWidth,
          maxHeight: this.maxHeight,
          quality: this.quality
        });
      }
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

  private _onImageCropped(event: CroppedImageEvent) {
    this._croppedFile = event.detail?.file ?? null;
    this._croppedBlob = event.detail?.blob ?? null;
    if(this.croppedPreviewURL){
      URL.revokeObjectURL(this.croppedPreviewURL);
    }
    if(this._croppedBlob){
      this.croppedPreviewURL = URL.createObjectURL(this._croppedBlob);
      this._updateChildPreviews();

      event.stopPropagation();
      this._emitEvt('image-cropped', { 
        blob: this._croppedBlob, 
        file: this._croppedFile 
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
          @image-cropped=${this._onImageCropped}
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
    'file-selected': PixelPusherFileSelectEvent
    'image-cropped': CroppedImageEvent
  }
}
