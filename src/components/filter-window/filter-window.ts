import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'

import Deferred from '@/models/deferred.ts';
import elementStyles from './filter-window.scss?inline'
import { type ModalWindow } from '@/components/modal-window/modal-window.ts'
import '@/components/modal-window/modal-window.ts';
import '@/components/range-input/range-input.ts'
import '@/components/toggle-switch/toggle-switch.ts'
import { cloneCanvas } from '@/utils/canvas';

import rotateIcon from '@/assets/rotate.png'
import brightnessIcon from '@/assets/brightness.png'
import contrastIcon from '@/assets/contrast.png'
import blurIcon from '@/assets/blur.png'
import grayscaleIcon from '@/assets/grayscale.png'
import imgQualityIcon from '@/assets/img-quality.png'

export type FilteredImageEvent = CustomEvent<{ canvas: HTMLCanvasElement }>

export type FilterOptions = {
  blur: number,
  grayscale: boolean,
  rotate: number,
  brightness: number,
  contrast: number,
}

@customElement('filter-window')
export class FilterWindow extends LitElement {
  private modalWindowRef = createRef<ModalWindow>()
  private canvasWrapperRef = createRef<HTMLDivElement>()

  private _deferredReq: Deferred<HTMLCanvasElement> | null = null;
  private _editCanvas: HTMLCanvasElement | null = null;
  private _filterOptions: FilterOptions | null = null;
  
  @state()
  private _selectedAction: string | null = null;

  @state()
  private _previewCanvas: HTMLCanvasElement | null = null;

  
  @property({ type: String, attribute: 'title' })
  title: string = 'Edit image';

  open(
    canvas: HTMLCanvasElement,
    filterOptions: FilterOptions,
    deferredRequest: Deferred<HTMLCanvasElement>
  ) {
    this.applyFilters(canvas, filterOptions, deferredRequest);
    this.modalWindowRef.value?.open();
  }

  applyFilters(
    canvas: HTMLCanvasElement, 
    filterOptions: FilterOptions,
    deferredRequest: Deferred<HTMLCanvasElement>
  ) {
    this._deferredReq = deferredRequest;
    this._editCanvas = canvas;
    this._previewCanvas = cloneCanvas(canvas);
    this._filterOptions = filterOptions;
    this.updatePreview(filterOptions);
  }

  updatePreview(filterOptions: FilterOptions) {
    const ctx = this._previewCanvas.getContext('2d');
    if (!ctx) return;
    
  }

  close() {
    this.modalWindowRef.value?.close();
  }

  private _resetState() {
    this._deferredReq = null;
  }

  private _onModalClose() {
    this._resetState();
  }

  private _emitEvt<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { 
      detail,
      bubbles: false,
      composed: false
    }))
  }

  private _selectAction(action: string) {
    this._selectedAction = action;
  }

  private _isSelectedAction(action: string) {
    return this._selectedAction === action;
  }

  render() {
    return html`
      <modal-window 
        ${ref(this.modalWindowRef)}
        title=${this.title}
        @modal-close=${this._onModalClose}
      >
        <div class="edit-window-body">
          <div class="canvas-wrapper" ${ref(this.canvasWrapperRef)}>
            ${this._previewCanvas ?? nothing}
          </div>
          <div class="controls-wrapper">
            <div class="control-details">
              ${
                this._selectedAction === 'brightness' ? html`
                  <range-input
                    value=${this._filterOptions?.brightness ?? 0}
                    min=${0}
                    max=${100}
                    @range-value-update=${(event: CustomEvent<{ value: number }>) => this._filterOptions.brightness = event.detail.value}
                  ></range-input>
                ` : nothing
              }
              ${
                this._selectedAction === 'contrast' ? html`
                  <range-input
                    value=${this._filterOptions?.contrast ?? 0}
                    min=${0}
                    max=${100}
                    @range-value-update=${(event: CustomEvent<{ value: number }>) => this._filterOptions.contrast = event.detail.value}
                  ></range-input>
                ` : nothing
              }
              ${
                this._selectedAction === 'blur' ? html`
                  <range-input
                    value=${this._filterOptions?.blur ?? 0}
                    min=${0}
                    max=${100}
                    @range-value-update=${(event: CustomEvent<{ value: number }>) => this._filterOptions.blur = event.detail.value}
                  ></range-input>
                ` : nothing
              }
              ${
                this._selectedAction === 'grayscale' ? html`
                  <toggle-switch
                    value=${this._filterOptions?.grayscale ?? false}
                    @toggle-switch-changed=${(event: CustomEvent<{ value: boolean }>) => this._filterOptions.grayscale = event.detail.value}
                  ></toggle-switch>
                ` : nothing
              }
              ${
                this._selectedAction === 'rotate' ? html`
                  <input 
                    type="range" 
                    class="rotate-input" 
                    value=${this._filterOptions?.rotate ?? 0} 
                    @input=${(event: Event) => this._filterOptions.rotate = (event.target as HTMLInputElement).valueAsNumber} 
                    min=${0}
                    max=${360}
                    step=${90}
                  />
                ` : nothing
              }
            </div>
            <div class="control-actions">
              <div class="actions-inner">
                <div 
                  class=${classMap({
                    'action-item': true,
                    'selected': this._isSelectedAction('rotate')
                  })} 
                  @click=${() => this._selectAction('rotate')}
                >
                  <img class="action-icon" src=${rotateIcon} alt="Rotate" />
                  <div class="action-label">Rotate</div>
                </div>
                <div 
                  class=${classMap({
                    'action-item': true,
                    'selected': this._isSelectedAction('brightness')
                  })} 
                  @click=${() => this._selectAction('brightness')}
                >
                  <img class="action-icon" src=${brightnessIcon} alt="Brightness" />
                  <div class="action-label">Brightness</div>
                </div>
                <div 
                  class=${classMap({
                    'action-item': true,
                    'selected': this._isSelectedAction('contrast')
                  })} 
                  @click=${() => this._selectAction('contrast')}
                >
                  <img class="action-icon" src=${contrastIcon} alt="Contrast" />
                  <div class="action-label">Contrast</div>
                </div>
                <div 
                  class=${classMap({
                    'action-item': true,
                    'selected': this._isSelectedAction('blur')
                  })} 
                  @click=${() => this._selectAction('blur')}
                >
                  <img class="action-icon" src=${blurIcon} alt="Blur" />
                  <div class="action-label">Blur</div>
                </div>
                <div 
                  class=${classMap({
                    'action-item': true,
                    'selected': this._isSelectedAction('grayscale')
                  })} 
                  @click=${() => this._selectAction('grayscale')}
                >
                  <img class="action-icon" src=${grayscaleIcon} alt="Grayscale" />
                  <div class="action-label">Grayscale</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="edit-window-footer" slot="footer">
          <button class="edit-footer-btn ghost cancel" @click=${this.close}>Cancel</button>
          <button class="edit-footer-btn primary crop">Save</button>
        </div>
      </modal-window>
    `
  }

  static styles = unsafeCSS(elementStyles)
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-window': FilterWindow
  }

  interface HTMLElementEventMap {
    'image-filtered': FilteredImageEvent
  }
}