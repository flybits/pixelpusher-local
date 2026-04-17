# pixelpusher

Web component `<pixel-pusher>`. The library build (`npm run build:lib`) publishes two ES modules under `dist/`:

| File | Use |
|------|-----|
| `pixel-pusher.js` | **Default:** smaller build; shared dependencies resolve from `node_modules` after you install the package. |
| `pixel-pusher.bundle.js` | **All-in-one:** self-contained module, larger download; no separate dependency resolution for the component at runtime. |

## Install

```bash
npm install pixelpusher
```

Installing the package installs its dependencies. You only need extra steps if your package manager or bundler cannot resolve nested packages (uncommon).

## Usage

### Default entry

Side-effect import so the custom element registers:

```js
import 'pixelpusher'
```

The default build loads shared packages from `node_modules` after install; your bundler resolves them like any other dependency.

### Bundled entry

For a single module without relying on separate dependency resolution (or as one script):

```js
import 'pixelpusher/bundle'
```

Types for both entries are the same: `pixelpusher` exports point at `./dist/src/pixel-pusher.d.ts`.

### When to use which

- **Default** — Smaller download; when your app already pulls in the same shared dependencies, or you want one shared version across components.
- **Bundle** — Simple pages, minimal tooling, or when you prefer one self-contained file (accepting a larger script if similar code exists elsewhere on the page).

Do **not** load both the default and the bundled script on the same page; the custom element would be defined twice.

## API

Clicking `<pixel-pusher>` opens an image file picker (`accept: image/*`, single file). If **`aspect-ratio` is greater than zero**, after a file is chosen the crop modal opens using `max-width`, `max-height`, `quality`, and `crop-modal-title`. If **`aspect-ratio` is zero or unset**, `file-selected` still fires when a file is picked, but the crop modal does not open, so **`image-cropped` does not fire** from that flow.

### Attributes

| HTML attribute | Property (TS/JS) | Notes |
|----------------|------------------|--------|
| `aspect-ratio` | `aspectRatio` | Decimal width ÷ height; `> 0` enables the crop flow |
| `max-width` | `maxWidth` | Used when exporting the cropped image (pixels) |
| `max-height` | `maxHeight` | Used when exporting the cropped image (pixels) |
| `quality` | `quality` | Export quality (default `0.92`) |
| `crop-modal-title` | `cropModalTitle` | Modal title (default `Crop Image`) |

For TypeScript, see the published declarations (`./dist/src/pixel-pusher.d.ts`) for exported types and symbols.

### Events

Both events use `bubbles: true` and `composed: true` so they cross shadow DOM boundaries.

| Event | `event.detail` | When |
|--------|----------------|------|
| `file-selected` | `File` | After the user picks a file (when a file exists) |
| `image-cropped` | `{ blob: Blob, file: File }` | After a successful crop; emitted on `<pixel-pusher>` |

The package augments `HTMLElementEventMap` for `file-selected` and `image-cropped` in TypeScript.

### Default slot

The clickable trigger wraps the **default** slot. **Without** slotted light DOM, the fallback UI shows the built-in upload placeholder and, after a successful crop, an internal preview image. **With** slotted content, that markup is the trigger; wiring your own preview targets uses `data-pp-preview` (below).

### `data-pp-preview`

After a successful crop (when a cropped blob exists), the component sets preview URLs on slotted content as follows:

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

Omit `aspect-ratio` or set it to `0` if you only need `file-selected` and do not want the crop modal (`image-cropped` will not fire from cropping because cropping is skipped).

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

Listening for `image-cropped`:

```js
document.querySelector('pixel-pusher').addEventListener('image-cropped', (e) => {
  console.log(e.detail.blob, e.detail.file);
});
```

## Development

```bash
npm run dev
```

Runs the Vite demo (port **5530**).

## Build

| Command | Output |
|---------|--------|
| `npm run build` | Demo app → `dist-app/` |
| `npm run build:lib` | Library → `dist/` (`pixel-pusher.js`, `pixel-pusher.bundle.js`, declarations) |

`prepublishOnly` runs `build:lib`.
