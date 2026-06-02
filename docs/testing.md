# Testing

## Automated Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Manual Browser Test

1. Start the dev server with `pnpm dev`.
2. Open `http://127.0.0.1:5173/Avatar-Driver/` in external Chrome.
3. Click Start Camera.
4. Grant camera permission.
5. Confirm `Camera running` and `Tracker ready`.
6. Move into view and confirm `face detected: true`.
7. Confirm Debug shows `Mesh: updated`.
8. Move your head, blink, and open your mouth; the face mesh should move.

## Troubleshooting

- If camera permission is denied, check Chrome site permissions and OS camera privacy settings.
- If worker initialization fails, verify that `public/wasm/` and `public/workers/` files are present.
- If the mesh does not update, check the Mesh diagnostics in the Debug panel.
