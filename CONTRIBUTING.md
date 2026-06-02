# Contributing

Thanks for helping improve Avatar Driver.

## Development Setup

Use Node.js 20 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173/Avatar-Driver/`.

## Quality Checks

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Pull Request Guidelines

- Keep changes focused and explain the user-visible behavior.
- Include tests for retargeting, smoothing, or data transformation changes.
- Verify camera behavior in external Chrome when changing webcam, worker, or MediaPipe code.
- Do not commit `dist/`, `node_modules/`, `.DS_Store`, local browser profiles, or generated cache files.
- For new assets, document the source, license, and purpose in the same directory.

## Browser Testing Notes

The Codex in-app browser may not expose camera access. Use external Chrome for end-to-end camera validation.

## Issue Reports

Useful issue reports include:

- Browser and OS version
- Camera permission state
- Whether `face detected` becomes `true`
- Debug panel values for Worker, Frames, and Mesh
- Console errors, if any
