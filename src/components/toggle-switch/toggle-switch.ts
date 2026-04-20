import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import type { PropertyValues } from 'lit'

import elementStyles from './toggle-switch.scss?inline'
export type ToggleSwitchChangedEvent = CustomEvent<{ value: boolean }>

@customElement('toggle-switch')
export class ToggleSwitch extends LitElement {

  /** Reflected as the `on` attribute — avoid `value` (empty `value=""` deserializes true for booleans in Lit). */
  @property({ type: Boolean, attribute: 'on' })
  value = false;

  @property({ type: Boolean, attribute: 'disabled' })
  disabled = false;

  private _compID = `toggle-switch-${Math.random().toString(36).substring(2, 15)}`;

  private _onChange(event: Event) {
    if (this.disabled) return;
    const input = event.target as HTMLInputElement;
    this.value = input.checked;
    this._emitEvt('toggle-switch-changed', { value: this.value });
  }

  private _onKeyDown(event: KeyboardEvent) {
    if (this.disabled) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.value = !this.value;
    this._emitEvt('toggle-switch-changed', { value: this.value });
  }

  private _emitEvt<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { 
      detail, 
      bubbles: false, 
      composed: false 
    }))
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!changed.has('value')) return;
    const input = this.renderRoot?.querySelector<HTMLInputElement>('.switch-input');
    if (input && input.checked !== this.value) {
      input.checked = this.value;
    }
  }

  render() {
    const on = this.value;
    return html`
      <div 
        class=${classMap({ 'toggle-switch': true, disabled: this.disabled })}
        @keydown=${this._onKeyDown}
        tabindex=${this.disabled ? -1 : 0}
        role="switch"
        aria-checked=${on ? 'true' : 'false'}
        aria-disabled=${this.disabled}
      >
        <input
          class="switch-input"
          type="checkbox"
          id=${this._compID}
          .checked=${on}
          ?disabled=${this.disabled}
          aria-hidden="true"
          tabindex="-1"
          @change=${this._onChange}
        />
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
