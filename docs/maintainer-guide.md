# Maintainer Guide

## Release Checklist

1. Run `pnpm typecheck`.
2. Run `pnpm lint`.
3. Run `pnpm test`.
4. Run `pnpm build`.
5. Verify the demo in external Chrome.
6. Check that the Debug panel reports `Mesh: updated` when a face is detected.
7. Update `CHANGELOG.md`.
8. Push to `main` and confirm GitHub Pages deployment succeeds.

## Asset Policy

Assets in `public/` are shipped to users. Every model or avatar asset should include source and license notes.

Current required runtime assets:

- `public/models/face_landmarker.task`
- `public/models/canonical_face_model.obj`
- `public/wasm/vision_bundle.js`
- `public/wasm/vision_wasm_internal.*`
- `public/wasm/vision_wasm_nosimd_internal.*`
- `public/workers/faceLandmarker.worker.js`

## Common Debug States

- `face detected: false`: MediaPipe is running, but no face is visible.
- `Mesh: no-landmarks`: no landmark array is available for the current frame.
- `Mesh: count-mismatch`: landmark count is smaller than the mesh vertex count.
- `Mesh: updated`: the 3D mesh is being driven by landmarks.

## Known Constraints

- Camera access requires a browser and OS permission grant.
- Some embedded browsers do not expose webcam APIs.
- The demo is optimized for a single face.
- Blendshape values vary by lighting, camera angle, and distance from the camera.
