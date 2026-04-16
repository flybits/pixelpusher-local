import { LitElement, html, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import uploadIcon from './assets/upload.svg'
import elementStyles from './pixel-pusher.scss?inline'

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('pixel-pusher')
export class PixelPusher extends LitElement {
  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0

  render() {
    return html`
      <div class="pixel-pusher">
        <div class="trigger-area">
          <slot>
            <div class="upload-area">
              <img class="upload-icon" src=${uploadIcon} alt="Pixel Pusher" />
            </div>
          </slot>
        </div>
      </div>
    `
  }

  static styles = unsafeCSS(elementStyles)
}

declare global {
  interface HTMLElementTagNameMap {
    'pixel-pusher': PixelPusher
  }
}
