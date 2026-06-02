# Avatar Driver

Avatar Driver is a browser-based face tracking demo that drives a simple 3D face mesh from a webcam stream. It uses MediaPipe Face Landmarker in a Web Worker, renders with React Three Fiber, and ships with all runtime assets needed for GitHub Pages.

Live demo: https://cutesnow.github.io/Avatar-Driver/

## What It Shows

- Local webcam capture with explicit start/stop controls
- Self-hosted MediaPipe model and WebAssembly runtime
- Face detection, blendshape, landmark, and head pose diagnostics
- A face-only 468-vertex mesh driven by MediaPipe landmarks
- Extra visible expression deformation for mouth, eyes, and brows
- Debug panels for FPS, latency, worker status, mesh status, and blendshapes
- GitHub Actions deployment to GitHub Pages

## Quick Start

Use Node.js 20 or newer.

```bash
pnpm install
pnpm dev
```

Open:

```txt
http://127.0.0.1:5173/Avatar-Driver/
```

Click **Start Camera** and grant camera permission in Chrome. The Codex in-app browser may not expose webcam access; use an external Chrome window for camera testing.

## Development Commands

```bash
pnpm typecheck
pnpm lint
pnpm test -- --run
pnpm build
```

To preview the production build:

```bash
pnpm build
pnpm preview
```

## Project Structure

```txt
src/app/                  React app shell and styles
src/core/avatar/          Three.js face mesh and avatar utilities
src/core/camera/          Webcam setup and video frame loop
src/core/expression/      Blendshape normalization and smoothing
src/core/mediapipe/       Face Landmarker worker types and helpers
src/core/retargeting/     Blendshape mapping helpers and tests
src/core/store/           Shared runtime diagnostics store
src/debug/                Debug and visualization panels
public/models/            MediaPipe task model and canonical face mesh
public/wasm/              Self-hosted MediaPipe WASM runtime
public/workers/           Classic worker used by the deployed app
```

## Runtime Assets

The demo is self-contained for static hosting:

- `public/models/face_landmarker.task`
- `public/models/canonical_face_model.obj`
- `public/wasm/*`
- `public/workers/faceLandmarker.worker.js`

The canonical face mesh has 468 vertices. MediaPipe can return 478 landmarks when iris landmarks are included, so the renderer drives the mesh with the first 468 face landmarks and ignores the extra eye points.

## GitHub Pages

The Vite base path is configured for this repository:

```txt
/Avatar-Driver/
```

The deployment workflow is in `.github/workflows/deploy.yml`. In GitHub, enable:

```txt
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

Pushing to `main` builds and publishes `dist/`.

## Privacy

- Webcam frames stay in the browser.
- Face inference runs locally with MediaPipe Tasks Vision.
- The demo does not collect, store, or transmit face data.
- Users can stop the camera from the UI or revoke browser/system camera permission.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Maintainer Guide](docs/maintainer-guide.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

Apache-2.0. See [LICENSE](LICENSE).
