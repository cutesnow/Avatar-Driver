# Deployment

Avatar Driver is configured for GitHub Pages at:

```txt
https://cutesnow.github.io/Avatar-Driver/
```

## Repository Settings

In GitHub:

```txt
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

## Workflow

The workflow in `.github/workflows/deploy.yml` runs on pushes to `main`:

1. Install pnpm and Node.js.
2. Install dependencies with the lockfile.
3. Run typecheck, lint, tests, and build.
4. Upload `dist/`.
5. Deploy the artifact to GitHub Pages.

## Base Path

`vite.config.ts` uses:

```ts
base: "/Avatar-Driver/"
```

Change this only if the repository name or hosting path changes.

## Demo and Docs

The demo is the GitHub Pages home page. Static documentation is published under:

```txt
/Avatar-Driver/docs/
```
