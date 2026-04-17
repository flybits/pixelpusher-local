import { LitElement, html, unsafeCSS, nothing } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js'
import { classMap } from 'lit/directives/class-map.js'
import elementStyles from './modal-window.scss?inline'

import closeIcon from '@/assets/close.svg'

export type ModalWindowCloseEvent = CustomEvent<void>

@customElement('modal-window')
export class ModalWindow extends LitElement {
  private modalWindowRef = createRef<HTMLDialogElement>()
  
  @state()
  private isOpen = false

  @property({ type: String })
  title = ''

  @property({ type: Boolean })
  dismissible = true

  private _onDialogClose() {
    if(this.isOpen){
      this.modalWindowRef.value?.showModal();
    }
  }

  private _onDialogCancel(e: Event) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  open() {
    this.modalWindowRef.value?.showModal()
    this.isOpen = true
  }

  close() {
    this.isOpen = false
    setTimeout(() => {
      this.modalWindowRef.value?.close()
      this._emitEvt('modal-close')
    }, 200)
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
      <dialog 
        class=${classMap({
          'modal-dialog': true,
          'open': this.isOpen
        })} 
        ${ref(this.modalWindowRef)}
        @close=${this._onDialogClose}
        @cancel.capture=${this._onDialogCancel}
      >
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <slot name="header">
              <div class="header-title">${this.title}</div>
            </slot>
            ${this.dismissible ? html`  
              <button class="close-btn" @click=${this.close}>
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

  interface HTMLElementEventMap {
    'modal-close': CustomEvent<void>
  }
}