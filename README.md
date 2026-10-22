# Vim Station

Vim Station is a React desktop-browser puzzle game that teaches Vim by repairing corrupted Robot Programs. Every edit immediately updates a ghost preview of the Robot's path through a space-station Scene. TanStack Router provides typed hash routes, and Tailwind CSS provides utility styling alongside the app's bespoke visual rules.

The product specification is in [`docs/spec.md`](docs/spec.md). Canonical domain terms are in [`CONTEXT.md`](CONTEXT.md).

## Requirements

- Node.js 22.12 or newer
- npm
- Neovim 0.12 for optional oracle verification

## Development

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Gameplay requires a hardware keyboard and a desktop-sized browser.

## Checks

```sh
npm run typecheck
npm test
npm run validate:content
npm run build
```

Browser tests install their engines separately with `npx playwright install` and run with `npm run test:browser`.

The Neovim-backed example verifier remains available as `npm run verify:examples`. Oracle and solver tooling have dedicated `verify:oracle` and `verify:solver` scripts.

## Production preview

```sh
npm run build
npm run preview
```

The application uses TanStack Router with hash history and builds as a static GitHub Pages artifact. Progress and settings are stored only in localStorage.
