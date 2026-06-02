# Architecture

Avatar Driver is a static web app. All inference and rendering happen in the browser.

## Runtime Flow

1. The user clicks Start Camera.
2. `createCameraStream` requests webcam access and attaches the stream to the video element.
3. `startVideoFrameLoop` samples the video into `ImageBitmap` frames.
4. `public/workers/faceLandmarker.worker.js` runs MediaPipe Face Landmarker in a classic Web Worker.
5. Worker results are normalized into an `ExpressionFrame`.
6. `expressionStore` publishes diagnostics and the latest expression frame.
7. `FaceMeshAvatar` reads the latest frame during the Three.js render loop.
8. The first 468 MediaPipe face landmarks drive the 468-vertex canonical face mesh.

## Why a Classic Worker?

The deployed worker uses `importScripts` to load the self-hosted MediaPipe bundle. Module workers do not support `importScripts`, so the production worker is kept as a classic worker in `public/workers/`.

## Landmark Counts

The MediaPipe result can include 478 landmarks. The canonical face OBJ has 468 vertices. The renderer maps only the first 468 face landmarks to the mesh and ignores the extra eye landmarks.

## Static Hosting

Vite copies `public/` into `dist/`, so the model, WASM files, worker, docs, and `.nojekyll` file are all available on GitHub Pages.
