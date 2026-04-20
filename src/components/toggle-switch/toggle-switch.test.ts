import { html, nothing, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import './toggle-switch.ts'
import type { ToggleSwitch } from './toggle-switch.ts'

describe('toggle-switch', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    render(nothing, container)
    container.remove()
  })

  it('renders with default off state', async () => {
    render(html`<toggle-switch></toggle-switch>`, container)
    const el = container.querySelector('toggle-switch') as ToggleSwitch
    await el.updateComplete
    expect(el.value).toBe(false)
    expect(el.shadowRoot?.querySelector('[role="switch"]')).toBeTruthy()
  })

  it('reflects the on attribute', async () => {
    render(html`<toggle-switch ?on=${true}></toggle-switch>`, container)
    const el = container.querySelector('toggle-switch') as ToggleSwitch
    await el.updateComplete
    expect(el.value).toBe(true)
  })

  it('dispatches toggle-switch-changed when the checkbox changes', async () => {
    render(html`<toggle-switch></toggle-switch>`, container)
    const el = container.querySelector('toggle-switch') as ToggleSwitch
    await el.updateComplete
    const input = el.shadowRoot?.querySelector<HTMLInputElement>('.switch-input')
    expect(input).toBeTruthy()

    const fired = new Promise<boolean>((resolve) => {
      el.addEventListener(
        'toggle-switch-changed',
        (e) => resolve((e as CustomEvent<{ value: boolean }>).detail.value),
        { once: true },
      )
    })
    input!.click()
    await expect(fired).resolves.toBe(true)
  })
})
