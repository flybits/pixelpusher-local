import { LitElement, html, unsafeCSS } from 'lit'
import type { PropertyValues } from 'lit'
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
  @state()
  private _displayValue = 0;

  @state()
  get curValue() {
    const el = this.rangeSliderTrackRef.value;
    if (!el) return 0;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const range = this.max - this.min;
    return Math.round(this.min + (el.scrollLeft / maxScroll) * range);
  }

  private _onInput() {
    this._displayValue = this.curValue;
    this._emitEvt('range-value-update', { value: this.curValue });
  }

  private _emitEvt<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { 
      detail,
      bubbles: true,
      composed: true
    }))
  }

  private _onReset() {
    this._setInitialPos();
  }

  private _setInitialPos() {
    const track = this.rangeSliderTrackRef.value;
    if (!track) return;
    const range = this.max - this.min;
    if (range <= 0) return;
    requestAnimationFrame(() => {
      const el = this.rangeSliderTrackRef.value;
      if (!el) return;
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const t = (this.value - this.min) / range;
      el.scrollLeft = t * maxScroll;
      this._onInput();
    });
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
      if(this.rangeSliderTrackRef.value){
        requestAnimationFrame(() => {
          this.rangeSliderTrackRef.value.scrollLeft -= deltaX;
          this._dragStartX = event.clientX;
          this._onInput();
        })
      }
    }
  }

  private _onPointerUp(event: PointerEvent) {
    event.stopPropagation();
    this.rangeSliderTrackRef.value?.releasePointerCapture(event.pointerId);
    this._isDragging = false;
  }

  private _isDeltaTick(tickIdx: number) {
    const inRangeIdx = Math.ceil(tickIdx/40 * (this.max - this.min) + this.min);
    return (
      (
        this.curValue < this.value && 
        inRangeIdx >= this.curValue &&
        inRangeIdx <= this.value
      ) ||
      (
        this.curValue > this.value && 
        inRangeIdx < this.curValue &&
        inRangeIdx >= this.value
      )
    )
  }

  protected firstUpdated(_changed: PropertyValues) {
    super.firstUpdated(_changed);
    this._setInitialPos();
  }

  protected updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has('value') || changed.has('min') || changed.has('max')) {
      this._setInitialPos();
    }
  }

  render() {
    return html`
      <div class="range-input">
        <div class="range-value">${this._displayValue}</div>
        <div 
          class=${classMap({ 
            'range-slider': true, 
            'is-dragging': this._isDragging 
          })}
        >
          <div class="slider-track"
            ${ref(this.rangeSliderTrackRef)}
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          >
            <div 
              class="range-slider-content"
            >
              ${Array.from({ length: 40 }).map((_, index) => html`
                <div class=${classMap({
                  'track-tick': true,
                  'is-delta': this._isDeltaTick(index)
                })} data-tick-idx=${index}></div>
              `)}
            </div>
          </div>
          <div class="range-value-indicator"></div>
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