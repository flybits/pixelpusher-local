# pixelpusher

A framework-agnostic `<pixel-pusher>` web component for image file selection with optional aspect-ratio cropping, optional image filters (rotation, brightness, contrast, grayscale, blur), and optimization.

**Live demo:** [https://flybits.github.io/pixelpusher-local/](https://flybits.github.io/pixelpusher-local/)

| File | Use |
|------|-----|
| `pixel-pusher.js` | **Default:** smaller build; shared dependencies resolve from `node_modules` after you install the package. |
| `pixel-pusher.bundle.js` | **All-in-one:** self-contained module, larger download; no separate dependency resolution for the component at runtime. |

## Install

```bash
npm install @flybits/pixelpusher
```

Installing the package installs its dependencies. You only need extra steps if your package manager or bundler cannot resolve nested packages (uncommon).

## Usage

### Default entry

Side-effect import so the custom element registers:

```js
import '@flybits/pixelpusher'
```

The default build loads shared packages from `node_modules` after install; your bundler resolves them like any other dependency.

### Bundled entry

For a single module without relying on separate dependency resolution (or as one script):

```js
import '@flybits/pixelpusher/bundle'
```

Types for both entries are the same: `@flybits/pixelpusher` exports point at `./dist/src/pixel-pusher.d.ts`.

### CDN embed (no npm install)

You can load the same all-in-one bundle from a CDN such as [jsDelivr](https://www.jsdelivr.com/) (or any static URL that serves `dist/pixel-pusher.bundle.js`). The published package is ESM, so use `type="module"` on the script tag.

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@flybits/pixelpusher@1.0.0-rc.1/dist/pixel-pusher.bundle.js"
></script>
<pixel-pusher aspect-ratio="1" max-width="1024" max-height="1024"></pixel-pusher>
```

This is equivalent to `import '@flybits/pixelpusher/bundle'`. Do **not** combine it with the default entry on the same page; see [When to use which](#when-to-use-which).

To pick up a newer release, replace `1.0.0-rc.1` in the URL or use a jsDelivr range tag (for example `@latest`); pinned versions avoid surprise upgrades.

### When to use which

- **Default** — Smaller download; when your app already pulls in the same shared dependencies, or you want one shared version across components.
- **Bundle** — Simple pages, minimal tooling, or when you prefer one self-contained file (accepting a larger script if similar code exists elsewhere on the page).

Do **not** load both the default and the bundled script on the same page; the custom element would be defined twice.

## Theming

The component uses **CSS custom properties** on `<pixel-pusher>` (or inherited from an **ancestor**). Internal shadow DOM styles read those tokens with `var(--pp-*, …)` (and a few host-only tokens such as `--accent`), so you can theme modals, buttons, sliders, and the default upload control without `::part` selectors.

### How to override

Set variables on the element or any parent:

```html
<pixel-pusher style="--accent: #0066cc;" aspect-ratio="1" max-width="1024" max-height="1024"></pixel-pusher>
```

```css
pixel-pusher.brand {
  --pp-modal-inner-padding: 24px;
}
```

Defaults are defined in Sass and emitted on the component host; for exact default colors and sizes, see [`src/_variables.scss`](src/_variables.scss) (`pp-host-theme-defaults` and `$pp-*-default`).

### `--accent` and `--pp-color-action-primary`

On the host, `--pp-color-action-primary` is set to `var(--accent, #26a69a)` after the default `--pp-*` map. That means:

- Changing **`--accent`** retints the built-in circular upload control (via `--accent-bg` / `--accent-border`) and, unless you override it separately, **primary actions** (modal buttons, range input, toggle) because they resolve `--pp-color-action-primary`.
- Setting **`--pp-color-action-primary`** directly on `<pixel-pusher>` overrides that alias for all uses of the primary action token (buttons, sliders, toggle).

### `--pp-*` tokens

These are declared on `<pixel-pusher>` via `pp-host-theme-defaults` in [`src/_variables.scss`](src/_variables.scss). Nested internals inherit them; each row notes where the **current** bundled styles reference the token.

| Token | Purpose | Current usage in this repo |
|-------|---------|------------------------------|
| `--pp-color-text-primary` | Default body / primary text | Declared on host; not referenced in bundled component SCSS yet |
| `--pp-color-text-heading` | Modal / section titles | Modal header title ([`src/components/modal-window/modal-window.scss`](src/components/modal-window/modal-window.scss)) |
| `--pp-color-text-label` | Form and control labels | Declared; not referenced yet |
| `--pp-color-text-description` | Supporting descriptions | Declared; not referenced yet |
| `--pp-color-text-muted` | De-emphasized text | Modal close control ([`src/components/modal-window/modal-window.scss`](src/components/modal-window/modal-window.scss)) |
| `--pp-color-text-placeholder` | Placeholder text | Declared; not referenced yet |
| `--pp-color-text-caption` | Captions / fine print | Declared; not referenced yet |
| `--pp-color-text-on-primary` | Text on primary-filled controls | Primary `flb-btn` ([`src/_mixins.scss`](src/_mixins.scss)) |
| `--pp-color-overlay-scrim` | Modal backdrop | Modal overlay ([`src/components/modal-window/modal-window.scss`](src/components/modal-window/modal-window.scss)) |
| `--pp-color-action-primary` | Primary actions, range/toggle accents | `flb-btn` primary and ghost label color; range input; toggle “on” ([`src/_mixins.scss`](src/_mixins.scss), [`src/components/range-input/range-input.scss`](src/components/range-input/range-input.scss), [`src/components/toggle-switch/toggle-switch.scss`](src/components/toggle-switch/toggle-switch.scss)); host default follows `--accent` ([`src/pixel-pusher.scss`](src/pixel-pusher.scss)) |
| `--pp-color-action-primary-hover` | Primary control hover | `flb-btn` primary hover and ghost hover text ([`src/_mixins.scss`](src/_mixins.scss)) |
| `--pp-color-action-ghost-hover` | Intended ghost-button hover emphasis | Declared on host; ghost hover in [`src/_mixins.scss`](src/_mixins.scss) currently uses `--pp-color-action-primary-hover`, not this token |
| `--pp-color-action-secondary` | Secondary button surface and border | `flb-btn` secondary ([`src/_mixins.scss`](src/_mixins.scss)) |
| `--pp-color-action-secondary-hover` | Secondary button hover | `flb-btn` secondary hover ([`src/_mixins.scss`](src/_mixins.scss)) |
| `--pp-modal-inner-padding` | Modal header horizontal padding; header bottom padding is half this value | Modal header ([`src/components/modal-window/modal-window.scss`](src/components/modal-window/modal-window.scss)) |
| `--pp-font-size-body` | Base UI font size | Modal close control ([`src/components/modal-window/modal-window.scss`](src/components/modal-window/modal-window.scss)) |
| `--pp-font-size-modal-title` | Modal title size | Modal header title ([`src/components/modal-window/modal-window.scss`](src/components/modal-window/modal-window.scss)) |
| `--pp-font-weight-semibold` | Semibold for titles and controls | Modal title and close ([`src/components/modal-window/modal-window.scss`](src/components/modal-window/modal-window.scss)) |

Tokens that are only declared today are still part of the public surface: you can set them for **slotted** light DOM content (`color: var(--pp-color-text-primary)` on children of `<pixel-pusher>`), for future UI, or to align with your design system. Their defaults mirror the Sass `$pp-*-default` values in [`src/_variables.scss`](src/_variables.scss).

### Additional variables on `<pixel-pusher>` (not `--pp-*`)

Besides the `--pp-*` tokens, [`src/pixel-pusher.scss`](src/pixel-pusher.scss) declares more custom properties on `:host`. **Chrome** means the component’s surrounding UI (for example the default circular upload control), not the crop/filter/export pipeline. That upload control mainly uses **`--accent`**, **`--accent-bg`**, and **`--accent-border`**. The table below lists the rest; you can use them in slotted content or your own CSS even when bundled styles do not reference every token with `var()`:

| Token | Role |
|-------|------|
| `--accent` | Brand accent; drives primary action color via `--pp-color-action-primary` unless overridden |
| `--accent-bg` | Upload control fill |
| `--accent-border` | Upload control border |
| `--text` | General body text (host-level convention) |
| `--text-h` | Emphasized / heading text |
| `--bg` | Surface background |
| `--border` | Default border color |
| `--code-bg` | Code-style surfaces |
| `--social-bg` | Muted panel / social strip background |
| `--shadow` | Box shadow recipe |
| `--sans` | Sans-serif stack |
| `--heading` | Heading font stack |
| `--mono` | Monospace stack |

The same host block is adjusted under **`@media (prefers-color-scheme: dark)`** in [`src/pixel-pusher.scss`](src/pixel-pusher.scss) (for example darker `--bg`, lighter `--text-h`, and a different `--accent`).

## API

Clicking `<pixel-pusher>` opens an image file picker (`accept: image/*`, single file). After a file is chosen, the pipeline runs: optional **crop** (when **`aspect-ratio` is greater than zero**), optional **filters** (see [Filters](#filters)), then export (resize per `max-width` / `max-height`, encode per `quality`). If **`aspect-ratio` is zero or unset**, the crop modal does not open, but **`file-selected`** still fires and, when processing completes successfully, **`image-edited`** still fires with the loaded image (plus any filters), subject to `max-width` / `max-height` / `quality`.

### Programmatic selection (`selectFile`, `selectURL`)

The element also exposes **`selectFile(file)`** and **`selectURL(url)`** as instance methods. They run the **same** load → optional crop → optional filters → export pipeline as a user-chosen file or a drag-and-drop, including the same rules for `aspect-ratio`, `interactive-filters`, cancellation, and `image-edited` (see [Events](#events)).

**`selectFile(file: File): Promise<void>`**

- If `file` is missing or falsy, the method returns immediately: no **`file-selected`**, no pipeline.
- Otherwise the component dispatches **`file-selected`** with that `File`, decodes the image, then continues through crop and filters as configured. When the run completes successfully, **`image-edited`** is emitted as usual.
- If the file cannot be decoded as an image, the error is logged and the method returns without emitting **`image-edited`** for that run.

**`selectURL(url: string): Promise<void>`**

- Performs `fetch(url)`. If the response is not OK (`!response.ok`), the returned promise **rejects** with an error whose message is **`Failed to fetch URL`**.
- Reads the body as a `Blob`, wraps it in a `File`, and calls **`selectFile`**:
  - **`type`** — the blob’s MIME type, or **`image/jpeg`** if the blob has no type.
  - **`name`** — the last segment of the URL’s pathname (URL-decoded), for example `…/foo%20bar.png` → `foo bar.png`. If there is no final segment, the name may be empty.
- Because this uses **`fetch`**, cross-origin URLs require normal **CORS** access from the browser; same-origin URLs and CORS-enabled CDNs work; arbitrary third-party hotlinks may fail.

**TypeScript** — These methods are part of the typed custom element (see **`HTMLElementTagNameMap['pixel-pusher']`** and the published `./dist/src/pixel-pusher.d.ts`).

**Vanilla examples**

From a separate file input (e.g. hidden) you can forward the chosen file into the component:

```js
const el = document.querySelector('pixel-pusher');
document.querySelector('#file-input').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file || !el) return;
  await el.selectFile(file);
});
```

Load from a URL (handle network and non-OK responses):

```js
const el = document.querySelector('pixel-pusher');
try {
  await el.selectURL('https://cdn.example.com/assets/photo.png');
} catch (err) {
  // e.g. fetch failed or !response.ok ("Failed to fetch URL")
  console.error(err);
}
```

### Filters

The filter step runs **after** the image is loaded and **after** cropping, if cropping is enabled.

**Declarative attributes** set rotation, blur, grayscale, brightness, and contrast on the `<pixel-pusher>` element. The component applies those values when the filter pipeline runs.

#### `interactive-filters`

This flag controls whether the user sees the **Edit image** modal and whether the filter pipeline runs when all filter attributes are at their defaults.

1. **Pipeline gating** — The filter step runs when **either** any filter attribute requests a non-default effect (`hasFilterConfigs`) **or** `interactive-filters` is set. If blur and rotation are zero, grayscale is off, and brightness and contrast are both `50`, then **`hasFilterConfigs` is false**. In that case, setting **`interactive-filters` alone** still enters the filter flow so the user can open the editor starting from neutral settings. Without `interactive-filters`, that pick **skips** filters entirely.

2. **Headless (non-interactive) apply** — When `interactive-filters` is **false** (default) and `hasFilterConfigs` is **true**, filters are applied **immediately** from the attribute values. No modal is shown; the pipeline continues to export.

3. **Interactive mode** — When `interactive-filters` is **true**, the **Edit image** modal opens. The UI is seeded from the current attribute values. The user can adjust rotation (90° steps, 0–360°), brightness, contrast, blur (sliders 0–100), and grayscale before confirming. **Apply** commits the preview and continues the pipeline. **Cancel** aborts the filter step (no `image-edited` from a successful completion of that run). **Skip effects** exports the image **without** the filter effects (the canvas as it was before this filter step).

4. **When to use which** — Use **`interactive-filters`** for flows where the user should tune the image (avatars, CMS assets, creative tools). Use **declarative attributes only** for fixed recipes (for example, always rotate 90° or always grayscale) where you do not want extra UI.

**Per-control semantics**

- **`rotate`** (`rotateDeg`) — Rotation in degrees; normalized modulo 360. Cardinal angles (90° / 180° / 270°) use a dedicated pixel path; other angles use canvas rotation and filtering.
- **`brightness`** / **`contrast`** — `0`–`100`; **`50` means no change** (neutral). Values away from `50` increase or decrease brightness or contrast.
- **`blur`** (`blurPx`) — Non-negative blur radius in **CSS pixels** (same numeric range as the interactive slider, `0`–`100`).
- **`grayscale`** — Boolean; when true, a full grayscale filter is applied.

**`filter-modal-title`** — Title for the Edit image modal (default `Edit image`), analogous to `crop-modal-title` for the crop modal.

### Attributes

| HTML attribute | Property (TS/JS) | Notes |
|----------------|------------------|--------|
| `aspect-ratio` | `aspectRatio` | Decimal width ÷ height; `> 0` enables the crop flow |
| `max-width` | `maxWidth` | Used when exporting the edited image (pixels); downscales only |
| `max-height` | `maxHeight` | Used when exporting the edited image (pixels); downscales only |
| `quality` | `quality` | Optional. How heavily the exported image is compressed (typically `0`–`1`; higher ≈ larger file, sharper). When set, a PNG or similar non-JPEG input is saved as WebP; SVG inputs are always WebP after rasterization. See [Quality and saved file format](#quality-and-saved-file-format). |
| `crop-modal-title` | `cropModalTitle` | Crop modal title (default `Crop image`) |
| `blur` | `blurPx` | Blur radius in px (`0` = none) |
| `rotate` | `rotateDeg` | Rotation in degrees (`0` = none) |
| `grayscale` | `grayscale` | When present / true, apply grayscale |
| `brightness` | `brightness` | `0`–`100`; `50` = neutral |
| `contrast` | `contrast` | `0`–`100`; `50` = neutral |
| `interactive-filters` | `interactiveFilters` | When true, opens the Edit image modal; also forces the filter pipeline to run even when all other filter attributes are at defaults. See [Filters](#filters). |
| `filter-modal-title` | `filterModalTitle` | Edit image modal title (default `Edit image`) |

### Quality and saved file format

These rules apply to the file delivered with the **`image-edited`** event (not the raw file from **`file-selected`** when you only need the picker).

**What `quality` does:** It sets how strong compression is on the exported result (roughly, higher ≈ larger file and sharper; lower ≈ smaller). It applies to JPEG and WebP outputs, including when a PNG-like file is saved as WebP because you set `quality`.

**By input type:**

- **JPEG** — The exported file stays a **JPEG**. `quality` only changes compression, not the format.
- **PNG** (and other non-JPEG bitmaps) — If you **set** `quality`, the exported file is saved as **WebP**. If you **omit** `quality`, the exported file stays the **same kind** as the original (e.g. PNG in → PNG out). If your backend expects PNG uploads, leave `quality` unset unless you are fine delivering WebP.
- **SVG** — After rasterization (crop and/or filters), the file is always **WebP**. `quality` still affects how compressed that WebP is.

For TypeScript, see the published declarations (`./dist/src/pixel-pusher.d.ts`) for exported types and symbols.

### Events

Both events use `bubbles: true` and `composed: true` so they cross shadow DOM boundaries.

| Event | `event.detail` | When |
|--------|----------------|------|
| `file-selected` | `File` | After the user picks a file (when a file exists) |
| `image-edited` | `{ canvas: HTMLCanvasElement, blob: Blob, file: File }` | After processing finishes successfully: optional crop, optional filters, then resize/encode. Not emitted if the user cancels crop or filters when those steps are shown. |

The package augments `HTMLElementEventMap` for `file-selected` and `image-edited` in TypeScript.

### Default slot

The clickable trigger wraps the **default** slot. **Without** slotted light DOM, the fallback UI shows the built-in upload placeholder and, after a successful edit, an internal preview image. **With** slotted content, that markup is the trigger; wiring your own preview targets uses `data-pp-preview` (below).

### `data-pp-preview`

After a successful edit (when an exported blob exists), the component sets preview URLs on slotted content as follows:

1. **First assigned element** of the default slot (flattened): if it is an **`img` with `data-pp-preview`**, its `src` is set to an object URL; otherwise, if it is any **`HTMLElement` with `data-pp-preview`** (and not handled as `img`), `style.backgroundImage` is set to `url(<object-url>)`.
2. **Descendants** of that first element: every **`img[data-pp-preview]`** gets `src` updated; every **`div[data-pp-preview]`** gets `backgroundImage` updated. Other element types are not matched by the descendant selectors (only the root node handles arbitrary non-`img` elements with the attribute).

Only the **first** flattened assigned element is used as the root for `querySelectorAll`. Previews must be that node or **descendants** of it. Multiple top-level slot nodes with the preview only in a later sibling (e.g. `<p></p><img data-pp-preview>`) will not work; use a single wrapper or put the preview under the first node.

### Examples

**No slotted children (component defaults)**

```html
<pixel-pusher
  aspect-ratio="1"
  max-width="1024"
  max-height="1024"
  crop-modal-title="Crop image"
></pixel-pusher>
```

Omit `aspect-ratio` or set it to `0` if you only need `file-selected` and do not want the crop modal. Processing can still complete and emit **`image-edited`** (with resize/quality applied when configured).

**Declarative filters (no modal)**

Fixed recipe: rotate 90°, grayscale, neutral brightness/contrast.

```html
<pixel-pusher
  aspect-ratio="1"
  rotate="90"
  grayscale
  brightness="50"
  contrast="50"
  max-width="1024"
  max-height="1024"
></pixel-pusher>
```

**Interactive filters (Edit image modal)**

User can tune effects before export; filter pipeline runs even when other filter attributes are left at defaults.

```html
<pixel-pusher
  aspect-ratio="1"
  interactive-filters
  filter-modal-title="Edit image"
  max-width="1024"
  max-height="1024"
></pixel-pusher>
```

**Slotted root `<img>`**

```html
<pixel-pusher aspect-ratio="1" max-width="800" max-height="800">
  <img data-pp-preview alt="" width="120" height="120" />
</pixel-pusher>
```

**Slotted root `<div>` (background image)**

```html
<pixel-pusher aspect-ratio="1.777" crop-modal-title="Crop hero image">
  <div
    data-pp-preview
    class="hero-thumb"
    role="img"
    aria-label="Image preview"
  ></div>
</pixel-pusher>
```

**Wrapper as first slot node — nested previews**

```html
<pixel-pusher aspect-ratio="1">
  <div class="picker-card">
    <img data-pp-preview alt="Thumbnail" />
  </div>
</pixel-pusher>
```

```html
<pixel-pusher aspect-ratio="1">
  <section class="layout">
    <div data-pp-preview class="cover"></div>
  </section>
</pixel-pusher>
```

**Multiple preview targets under one root**

```html
<pixel-pusher aspect-ratio="1">
  <div class="row">
    <img data-pp-preview alt="" class="sm" />
    <img data-pp-preview alt="" class="lg" />
    <div data-pp-preview class="bg-tile"></div>
  </div>
</pixel-pusher>
```

**Listening for events**

**Vanilla**

```js
const el = document.querySelector('pixel-pusher');
el.addEventListener('file-selected', (e) => {
  console.log(e.detail);
});
el.addEventListener('image-edited', (e) => {
  console.log(e.detail.canvas, e.detail.blob, e.detail.file);
});
```

**Vue 3** (`@file-selected` / `@image-edited` forward to native listeners on the custom element)

```vue
<script setup lang="ts">
import '@flybits/pixelpusher';

function onFileSelected(e: CustomEvent<File>) {
  console.log(e.detail);
}

function onImageEdited(
  e: CustomEvent<{ canvas: HTMLCanvasElement; blob: Blob; file: File }>
) {
  console.log(e.detail.canvas, e.detail.blob, e.detail.file);
}
</script>

<template>
  <pixel-pusher
    aspect-ratio="1"
    max-width="1024"
    max-height="1024"
    @file-selected="onFileSelected"
    @image-edited="onImageEdited"
  />
</template>
```

The package augments `HTMLElementEventMap` for these event names; you can rely on the published `.d.ts` for stricter typing if you prefer.

**React** (use `addEventListener` on a ref—React does not treat hyphenated custom events like Vue’s `@` syntax)

```tsx
import '@flybits/pixelpusher';
import { useEffect, useRef } from 'react';

export function PixelPusherField() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onFile = (e: Event) => {
      const ce = e as CustomEvent<File>;
      console.log(ce.detail);
    };
    const onEdited = (e: Event) => {
      const ce = e as CustomEvent<{
        canvas: HTMLCanvasElement;
        blob: Blob;
        file: File;
      }>;
      console.log(ce.detail.canvas, ce.detail.blob, ce.detail.file);
    };

    el.addEventListener('file-selected', onFile);
    el.addEventListener('image-edited', onEdited);
    return () => {
      el.removeEventListener('file-selected', onFile);
      el.removeEventListener('image-edited', onEdited);
    };
  }, []);

  return (
    <pixel-pusher
      ref={ref}
      aspectRatio={1}
      maxWidth={1024}
      maxHeight={1024}
    />
  );
}
```

Set properties with the camelCase names from the [Attributes](#attributes) table (`aspectRatio`, `maxWidth`, …) so you avoid hyphenated JSX attribute issues.
