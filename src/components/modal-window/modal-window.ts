import { LitElement, html, unsafeCSS, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'
import elementStyles from './modal-window.scss?inline'

import closeIcon from '@/assets/close.svg'

@customElement('modal-window')
export class ModalWindow extends LitElement {
  private modalWindowRef = createRef<HTMLDivElement>()
  private isOpen = false

  @property({ type: String })
  title = ''

  @property({ type: Boolean })
  dismissible = false

  render() {
    return html`
      <dialog 
        class=${classMap({
          'modal-window': true,
          'open': this.isOpen
        })} 
        ${ref(this.modalWindowRef)}
      >
        <div class="modal-overlay"/>
        <div class="modal-content">
          <div class="modal-header">
            <slot name="header">
              <div class="header-title">${this.title}</div>
            </slot>
            ${this.dismissible ? html`  
              <button class="close-btn" @click="close">
                <img src=${closeIcon} alt="Close" class="close-icon" />
              </button>
            ` : nothing }
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </dialog>
    `
  }

  static styles = unsafeCSS(elementStyles)
}

declare global {
  interface HTMLElementTagNameMap {
    'modal-window': ModalWindow
  }
}