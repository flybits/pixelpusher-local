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
import { applyRasterTransforms, cloneCanvas, type RasterTransformOptions } from '@/utils/canvas';

import rotateIcon from '@/assets/rotate.png'
import brightnessIcon from '@/assets/brightness.png'
import contrastIcon from '@/assets/contrast.png'
import blurIcon from '@/assets/blur.png'
import grayscaleIcon from '@/assets/grayscale.png'
import imgQualityIcon from '@/assets/img-quality.png'

export type FilteredImageEvent = CustomEvent<{ canvas: HTMLCanvasElement }>
export type ImageFilteredCancelledEvent = CustomEvent<void>

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
  private _interactiveMode: boolean = false;

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
    this._interactiveMode = true;
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
    let opts: RasterTransformOptions = {
      blurPx: filterOptions.blur,
      grayscale: filterOptions.grayscale,
      rotationDeg: filterOptions.rotate,
      brightness: 1,
      contrast: 1,
    }

    if(filterOptions.brightness && filterOptions.brightness !== 50) {
      opts.brightness = filterOptions.brightness / 50;
    }

    if(filterOptions.contrast && filterOptions.contrast !== 50) {
      opts.contrast = filterOptions.contrast / 50;
    }

    this._previewCanvas = applyRasterTransforms(this._editCanvas, opts);

    if(!this._interactiveMode) {
      this.commitFilters();
    }
  }

  commitFilters() {
    this._deferredReq?.resolve(this._previewCanvas);
    this._emitEvt('image-filtered', { canvas: this._previewCanvas });
    this.close();
  }

  skipEffects() {
    this._deferredReq?.resolve(this._editCanvas);
    this._emitEvt('image-filtered', { 
      skipEffects: true,
      canvas: this._editCanvas 
    });
    this.close();
  }

  cancel() {
    this._deferredReq?.reject();
    this._emitEvt('image-filtered-cancelled');
    this.close();
  }

  close() {
    this.modalWindowRef.value?.close();
    this._resetState();
    this._interactiveMode = false;
    this._selectedAction = null;
    this._filterOptions = null;
    this._previewCanvas = null;
    this._editCanvas = null;
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
                    @range-value-update=${(event: CustomEvent<{ value: number }>) => {this._filterOptions.brightness = event.detail.value; this.updatePreview(this._filterOptions)}}
                  ></range-input>
                ` : nothing
              }
              ${
                this._selectedAction === 'contrast' ? html`
                  <range-input
                    value=${this._filterOptions?.contrast ?? 0}
                    min=${0}
                    max=${100}
                    @range-value-update=${(event: CustomEvent<{ value: number }>) => {this._filterOptions.contrast = event.detail.value; this.updatePreview(this._filterOptions)}}
                  ></range-input>
                ` : nothing
              }
              ${
                this._selectedAction === 'blur' ? html`
                  <range-input
                    value=${this._filterOptions?.blur ?? 0}
                    min=${0}
                    max=${100}
                    @range-value-update=${(event: CustomEvent<{ value: number }>) => {this._filterOptions.blur = event.detail.value; this.updatePreview(this._filterOptions)}}
                  ></range-input>
                ` : nothing
              }
              ${
                this._selectedAction === 'grayscale' ? html`
                  <toggle-switch
                    value=${this._filterOptions?.grayscale ?? false}
                    @toggle-switch-changed=${(event: CustomEvent<{ value: boolean }>) => {this._filterOptions.grayscale = event.detail.value; this.updatePreview(this._filterOptions)}}
                  ></toggle-switch>
                ` : nothing
              }
              ${
                this._selectedAction === 'rotate' ? html`
                  <input 
                    type="range" 
                    class="rotate-input" 
                    value=${this._filterOptions?.rotate ?? 0} 
                    @input=${(event: Event) => {this._filterOptions.rotate = (event.target as HTMLInputElement).valueAsNumber; this.updatePreview(this._filterOptions)}} 
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
                  title="Rotate"
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
                  title="Brightness"
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
                  title="Contrast"
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
                  title="Blur"
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
                  title="Grayscale"
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
          <button class="edit-footer-btn ghost cancel" @click=${this.cancel}>Cancel</button>
          <div class="btn-group">
            <button class="edit-footer-btn ghost crop" @click=${this.skipEffects}>Skip effects</button>
            <button class="edit-footer-btn primary crop" @click=${this.commitFilters}>Apply</button>
          </div>
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
    'image-filtered-cancelled': ImageFilteredCancelledEvent
  }
}