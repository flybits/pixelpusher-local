import { LitElement, html, nothing, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'

import resetIcon from '@/assets/undo.png'
import elementStyles from './range-input.scss?inline'

export type RangeValueUpdateEvent = CustomEvent<{ value: number }>

@customElement('range-input')
export class RangeInput extends LitElement {
  private rangeSliderTrackRef = createRef<HTMLDivElement>();

  @property({ type: Number, attribute: 'value' })
  value = 0;

  @property({ type: Number, attribute: 'min' })
  min = 0;

  @property({ type: Number, attribute: 'max' })
  max = 100;

  @property({ type: Number, attribute: 'step' })
  step = 1;

  @property({ type: String, attribute: 'label' })
  label = '';

  @state()
  private _isDragging = false;
  private _dragStartX = 0;

  private _onInput(event: Event) {
    event.stopPropagation();
    
    this._emitEvt('range-value-update', { value: this.value });
  }

  private _emitEvt<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { 
      detail,
      bubbles: true,
      composed: true
    }))
  }

  private _onReset() {
    this.value = this.min;
  }

  private _onPointerDown(event: PointerEvent) {
    event.stopPropagation();
    this.rangeSliderTrackRef.value?.setPointerCapture(event.pointerId);
    this._isDragging = true;
    this._dragStartX = event.clientX;
  }

  private _onPointerMove(event: PointerEvent) {
    event.stopPropagation();
    if (this._isDragging) {
      const deltaX = event.clientX - this._dragStartX;
      this._dragStartX = event.clientX;
      if(this.rangeSliderTrackRef.value){
        window.requestAnimationFrame(() => {
          this.rangeSliderTrackRef.value.scrollLeft -= deltaX;
        })
      }
    }
  }

  private _onPointerUp(event: PointerEvent) {
    event.stopPropagation();
    this.rangeSliderTrackRef.value?.releasePointerCapture(event.pointerId);
    this._isDragging = false;
  }

  render() {
    return html`
      <div class="range-input">
        <div class="range-value">${this.value}</div>
        <div class="range-slider">
          <div 
            class="range-slider-track"
            ${ref(this.rangeSliderTrackRef)}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          >
            ${Array.from({ length: 40 }).map((_, index) => html`
              <div class="track-tick" data-tick-idx=${index}></div>
            `)}
          </div>
        </div>
        <div class="range-reset" @click=${this._onReset}>
          <img src=${resetIcon} alt="Reset" class="reset-icon"/>
        </div>
      </div>
    `;
  }

  static styles = unsafeCSS(elementStyles) 
}

declare global {
  interface HTMLElementTagNameMap {
    'range-input': RangeInput
  }

  interface HTMLElementEventMap {
    'range-value-update': RangeValueUpdateEvent
  }
}