import { html, nothing, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import './range-input.ts'
import type { RangeInput } from './range-input.ts'

describe('range-input', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    render(nothing, container)
    container.remove()
  })

  it('renders range chrome and reflects the label property', async () => {
    render(
      html`<range-input label="Exposure" .min=${0} .max=${10} .value=${5}></range-input>`,
      container,
    )
    const el = container.querySelector('range-input') as RangeInput
    await el.updateComplete
    expect(el.shadowRoot?.querySelector('.range-input')).toBeTruthy()
    expect(el.label).toBe('Exposure')
    expect(el.shadowRoot?.querySelector('.range-value')).toBeTruthy()
  })

  it('exposes min, max, step', async () => {
    render(
      html`<range-input .min=${2} .max=${20} .step=${2} .value=${6}></range-input>`,
      container,
    )
    const el = container.querySelector('range-input') as RangeInput
    await el.updateComplete
    expect(el.min).toBe(2)
    expect(el.max).toBe(20)
    expect(el.step).toBe(2)
  })
})
