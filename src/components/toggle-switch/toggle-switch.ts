import { LitElement, html, unsafeCSS } from 'lit'
import type { PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'

import elementStyles from './toggle-switch.scss?inline'
export type ToggleSwitchChangedEvent = CustomEvent<{ value: boolean }>

@customElement('toggle-switch')
export class ToggleSwitch extends LitElement {

  @property({ type: Boolean, attribute: 'value' })
  value = false;

  @property({ type: Boolean, attribute: 'disabled' })
  disabled = false;

  private _compID = `toggle-switch-${Math.random().toString(36).substring(2, 15)}`;

  private _toggle(evt: Event) {
    evt.stopPropagation();
    evt.preventDefault();
    if (this.disabled) return;
    this.value = !this.value;
    this._emitEvt('toggle-switch-changed', { value: this.value });
  }

  private _emitEvt<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }))
  }

  render() {
    return html`
      <div 
        class="toggle-switch"
        @click=${this._toggle}
        tabindex="0"
        role="switch"
        aria-checked=${this.value}
      >
        <input class="switch-input" type="checkbox" id=${this._compID} .checked=${this.value} disabled=${this.disabled} aria-disabled=${this.disabled} aria-hidden="true" tabindex="-1"/>
        <label class="switch-label" for=${this._compID}>Toggle</label>
      </div>
    `
  }

  static styles = unsafeCSS(elementStyles)
}

declare global {
  interface HTMLElementTagNameMap {
    'toggle-switch': ToggleSwitch
  }

  interface HTMLElementEventMap {
    'toggle-switch-changed': ToggleSwitchChangedEvent
  }
}