# pixelpusher

A framework-agnostic `<pixel-pusher>` web component for image file selection with optional aspect-ratio cropping, optional image filters (rotation, brightness, contrast, grayscale, blur), and optimization.

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

### When to use which

- **Default** — Smaller download; when your app already pulls in the same shared dependencies, or you want one shared version across components.
- **Bundle** — Simple pages, minimal tooling, or when you prefer one self-contained file (accepting a larger script if similar code exists elsewhere on the page).

Do **not** load both the default and the bundled script on the same page; the custom element would be defined twice.

## API

Clicking `<pixel-pusher>` opens an image file picker (`accept: image/*`, single file). After a file is chosen, the pipeline runs: optional **crop** (when **`aspect-ratio` is greater than zero**), optional **filters** (see [Filters](#filters)), then export (resize per `max-width` / `max-height`, encode per `quality`). If **`aspect-ratio` is zero or unset**, the crop modal does not open, but **`file-selected`** still fires and, when processing completes successfully, **`image-edited`** still fires with the loaded image (plus any filters), subject to `max-width` / `max-height` / `quality`.

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
