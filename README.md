# pixelpusher

Framework-agnostic `<pixel-pusher>` web component: image pick or drop, optional aspect-ratio crop, filters (rotate, brightness, contrast, grayscale, blur), and resize/export.

**Demo:** [https://flybits.github.io/pixelpusher-local/](https://flybits.github.io/pixelpusher-local/)

## Install and load

```bash
npm install @flybits/pixelpusher
```

The package installs its own dependencies; extra resolution steps are uncommon.

| Entry | Use |
|-------|-----|
| `import '@flybits/pixelpusher'` | Default build: smaller; bundler pulls shared deps from `node_modules`. |
| `import '@flybits/pixelpusher/bundle'` | All-in-one; larger script, no separate dep resolution at runtime. |

Do **not** load default and bundle on the same page (the custom element would be registered twice).

**Default** (side-effect import registers the element):

```js
import '@flybits/pixelpusher'
```

**Bundle:**

```js
import '@flybits/pixelpusher/bundle'
```

Types for both point at `./dist/src/pixel-pusher.d.ts`.

**CDN** — same module as the bundle; ESM requires `type="module"`. Use [jsDelivr](https://www.jsdelivr.com/) or any URL that serves `dist/pixel-pusher.bundle.js`. Pin a version in the URL or use `@latest` if you accept floating upgrades.

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@flybits/pixelpusher/dist/pixel-pusher.bundle.js"
></script>
<pixel-pusher aspect-ratio="1" max-width="1024" max-height="1024"></pixel-pusher>
```

## Behavior

**Default, interactive usage:** You only need the custom element in the page (after importing the package). The user picks an image by **clicking or focusing** the control, which opens the browser’s single-file picker (`accept: image/*`), or by **dropping** a valid image file onto it. Crop, filters, and export limits are controlled with **HTML attributes**; you listen for **`file-selected`** and **`image-edited`** if you need the `File` or the processed result. No imperative JavaScript is required for that path.

**Processing pipeline** (picker, drop, or programmatic methods below): decode → optional **crop** if `aspect-ratio` > 0 → optional **filters** → export (resize via `max-width` / `max-height`, encode via `quality`). If `aspect-ratio` is omitted or `0`, the crop step is skipped; `file-selected` still fires, and on success **`image-edited`** still fires with filters/export as configured.

## Optional programmatic API (`selectFile` / `selectURL`)

**These methods are optional.** They exist for flows where the image does not come from the component’s own picker or drop target—for example a hidden `<input type="file">` you forward into the element, an image fetched from a URL, automated tests, or another UI that already has a `File`. They run the **same** pipeline and emit the **same** events as the built-in interaction.

Typed on `HTMLElementTagNameMap['pixel-pusher']` and in the published `.d.ts`.

| Method | Notes |
|--------|--------|
| `selectFile(file)` | If `file` is falsy, returns immediately (no events). Otherwise emits `file-selected`, decodes; decode failure is logged and **`image-edited`** is not emitted for that run. |
| `selectURL(url)` | `fetch(url)`; rejects with message **`Failed to fetch URL`** if `!response.ok`. Wraps the body in a `File` (`type` from blob or `image/jpeg`; `name` from the last URL path segment, URL-decoded) and calls `selectFile`. Cross-origin URLs need CORS. |

Forwarding a separate file input, or starting the pipeline from a remote image URL:

```js
const el = document.querySelector('pixel-pusher');

document.querySelector('#file-input')?.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (file && el) await el.selectFile(file);
});

try {
  await el.selectURL('https://cdn.example.com/assets/photo.png');
} catch (err) {
  console.error(err); // network or "Failed to fetch URL"
}
```

## Filters

Filters run after load and after crop. HTML attributes drive `rotate`, `blur`, `brightness`, `contrast`, and `grayscale`.

- The filter step runs when **any** filter attribute is non-default **or** `interactive-filters` is set. With all-neutral values and **no** `interactive-filters`, the filter step is skipped.
- **`interactive-filters` off** (default) and non-default attrs: filters apply immediately; no modal.
- **`interactive-filters` on:** **Edit image** opens after crop (if any), before export, and blocks until the user finishes. The modal is **seeded from** your filter attributes; the user can change rotation (90° steps), brightness, contrast, blur, and grayscale. **Apply** runs export with the chosen edits; **Cancel** aborts (**no** **`image-edited`**); **Skip effects** exports without applying that filter pass.

Use `filter-modal-title` for the modal title (default **`Edit image`**).

## Attributes

| HTML attribute | Property | Notes |
|----------------|----------|-------|
| `aspect-ratio` | `aspectRatio` | Width ÷ height; `> 0` enables crop |
| `max-width` | `maxWidth` | Export max width (px); downscale only |
| `max-height` | `maxHeight` | Export max height (px); downscale only |
| `quality` | `quality` | Optional; typical range `0`–`1` (higher ≈ larger/sharper). See **Export format**. |
| `crop-modal-title` | `cropModalTitle` | Default `Crop image` |
| `blur` | `blurPx` | `0`–`100` (CSS px) |
| `rotate` | `rotateDeg` | Degrees (normalized mod 360) |
| `grayscale` | `grayscale` | Boolean |
| `brightness` | `brightness` | `0`–`100`; `50` = neutral |
| `contrast` | `contrast` | `0`–`100`; `50` = neutral |
| `interactive-filters` | `interactiveFilters` | **Edit image** after crop (if any); blocks until Apply / Cancel / Skip; forces the filter step when other attrs are still at defaults |
| `filter-modal-title` | `filterModalTitle` | Default `Edit image` |

## Export format (`image-edited` file)

Rules apply to the synthesized `File` on **`image-edited`**, not the raw picker payload on **`file-selected`**.

- **JPEG** → output stays JPEG; `quality` only affects compression.
- **PNG** (and other non-JPEG rasters) → with **`quality` set**, output is **WebP**; with **`quality` omitted**, format matches the input.
- **SVG** → after rasterization, output is always **WebP**; `quality` affects WebP compression.

## Events

Both use `bubbles: true` and `composed: true`. The package augments `HTMLElementEventMap` for typings.

| Event | `detail` | When |
|-------|----------|------|
| `file-selected` | `File` | When a file enters the pipeline (picker, drop, `selectFile`, or `selectURL`) |
| `image-edited` | `{ canvas: HTMLCanvasElement, blob: Blob, file: File }` | After successful crop / filters / export. Not emitted if the user cancels a shown crop or filter step. |

## Slot and `data-pp-preview`

The **default** slot is the interactive trigger. With no slotted content you get the built-in upload UI and internal preview; with slotted markup, that content is the trigger.

After a successful export, previews use the **first** assigned node in the default slot as the root. That node can be `img[data-pp-preview]` (`src`) or another element with `data-pp-preview` (`backgroundImage`). Descendants `img[data-pp-preview]` and `div[data-pp-preview]` under that root are updated the same way. A preview only on a *later* top-level sibling will not run—use one wrapper as the first node.

## Examples

```html
<pixel-pusher aspect-ratio="1" max-width="1024" max-height="1024"></pixel-pusher>
```

Skip crop: omit `aspect-ratio` or set `0`; you can still get `image-edited` with resize/quality/filters.

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

```html
<pixel-pusher aspect-ratio="1" interactive-filters max-width="1024" max-height="1024"></pixel-pusher>
```

```html
<pixel-pusher aspect-ratio="1" max-width="800" max-height="800">
  <img data-pp-preview alt="" width="120" height="120" />
</pixel-pusher>
```

```js
const el = document.querySelector('pixel-pusher');
el.addEventListener('file-selected', (e) => console.log(e.detail));
el.addEventListener('image-edited', (e) =>
  console.log(e.detail.canvas, e.detail.blob, e.detail.file)
);
```

**Vue 3** — `@file-selected` / `@image-edited` forward to native listeners on the custom element:

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

The package augments `HTMLElementEventMap` for these event names; use the published `.d.ts` for stricter typing if you prefer.

**React** — use `addEventListener` on a ref (hyphenated custom events do not map like Vue’s `@` syntax). Use camelCase DOM properties in JSX (`aspectRatio`, `maxWidth`, …):

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

## Theming

Set **CSS custom properties** on `<pixel-pusher>` or an ancestor. Shadow styles read `var(--pp-*, …)` and host tokens such as `--accent`, so you can theme without `::part`.

On the host, `--pp-color-action-primary` is wired to `var(--accent, …)` after the default `--pp-*` map in [`src/pixel-pusher.scss`](src/pixel-pusher.scss): set **`--accent`** for the built-in upload control and primary actions, or set **`--pp-color-action-primary`** to override primary actions only. Additional host chrome (`--text`, `--bg`, font stacks, etc.) and `prefers-color-scheme: dark` live in the same file.

Default values for the Sass mirrors (`$pp-*-default`) are in [`src/_variables.scss`](src/_variables.scss).

### Core `--pp-*` variables

| Token | Role |
|-------|------|
| `--pp-color-text-primary` | Primary body text |
| `--pp-color-text-heading` | Modal / section titles |
| `--pp-color-text-label` | Labels |
| `--pp-color-text-description` | Supporting descriptions |
| `--pp-color-text-muted` | Muted / secondary text |
| `--pp-color-text-placeholder` | Placeholder text |
| `--pp-color-text-caption` | Captions / fine print |
| `--pp-color-text-on-primary` | Text on primary-filled controls |
| `--pp-color-overlay-scrim` | Modal backdrop |
| `--pp-color-action-primary` | Primary actions, range/toggle accents |
| `--pp-color-action-primary-hover` | Primary control hover |
| `--pp-color-action-ghost-hover` | Ghost-button hover emphasis |
| `--pp-color-action-secondary` | Secondary button surface and border |
| `--pp-color-action-secondary-hover` | Secondary button hover |
| `--pp-modal-inner-padding` | Modal inner padding (header horizontal; header bottom is half) |
| `--pp-font-size-body` | Base UI font size |
| `--pp-font-size-modal-title` | Modal title size |
| `--pp-font-weight-semibold` | Semibold for titles and controls |

```html
<pixel-pusher style="--accent: #0066cc;" aspect-ratio="1" max-width="1024" max-height="1024"></pixel-pusher>
```

```css
pixel-pusher.brand {
  --pp-modal-inner-padding: 24px;
}
```
