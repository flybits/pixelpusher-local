# pixelpusher

Lit custom element `<pixel-pusher>`. The library build (`npm run build:lib`) publishes two ES modules under `dist/`:

| File | Use |
|------|-----|
| `pixel-pusher.js` | Default: **does not** bundle Lit; your app must depend on `lit`. |
| `pixel-pusher.bundle.js` | Self-contained: **includes** Lit; larger download, no separate `lit` install. |

## Install

```bash
npm install pixelpusher
```

For the default entry, also install Lit (or ensure it is hoisted):

```bash
npm install lit
```

## Usage

### Default entry (Lit as a dependency)

Side-effect import so the custom element registers:

```js
import 'pixelpusher'
```

You must have `lit` available to the bundler or runtime that loads this file (the published file under `dist/pixel-pusher.js` imports `lit`).

### Bundled entry (Lit included)

For a single module without installing `lit` separately:

```js
import 'pixelpusher/bundle'
```

Types for both entries are the same: `pixelpusher` exports point at `./dist/src/pixel-pusher.d.ts`.

### When to use which

- **Default** — Apps that already use Lit, or when you want a single shared `lit` version and a smaller component file.
- **Bundle** — Static pages, hosts without a package graph for `lit`, or when you want one script and accept duplicate Lit if another part of the page also ships Lit.

Do **not** load both the default and the bundled script on the same page; the custom element would be defined twice.

The bundled file redistributes [Lit](https://lit.dev/) (Apache-2.0). If you republish that artifact, comply with Lit’s license and notices.

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
