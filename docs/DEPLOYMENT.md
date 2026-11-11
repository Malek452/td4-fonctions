# Static deployment

The deliverable is the complete **`dist/` directory** produced by `npm run build`. React, the Motion Canvas player, compiled glyphs, CSS and fonts are served as static files. Never deploy the development server or the authoring editor as the student site.

## GitHub Pages

This presentation lives in its own repository, [Malek452/td4-fonctions](https://github.com/Malek452/td4-fonctions), and is published at [malek452.github.io/td4-fonctions](https://malek452.github.io/td4-fonctions/).

GitHub Pages uses **GitHub Actions**. Each push to `main` validates and builds this project, then deploys only its `dist/` directory. Manual deployment remains available under **Actions → Deploy to GitHub Pages → Run workflow**.

The workflow uses the built-in `GITHUB_TOKEN`; no personal token or repository secret is required. Its Pages deployment is independent of the original Atelier Présentations repository.

Vite uses relative asset URLs (`base: './'`), so a project URL such as `https://USERNAME.github.io/REPOSITORY/` works without hard-coding a username. Activity navigation uses hashes; no SPA route rewrites are necessary.

## Netlify or another static host

Use Node 24, build command `npm run build` and publish directory `dist`. `netlify.toml` provides these settings for Netlify. Run `npm test` locally or in CI before publishing. Upload the entire directory, including `animations/`, `assets/` and `handout/`.

## Local production check

```sh
npm ci
npm run validate
npm run preview
```

Visit the URL printed by the preview server. Test a direct `#activity/...` link, playback and a hard refresh. Open `handout/` too. Opening `dist/index.html` directly as a `file:` URL is unsupported because the browser must load JavaScript modules over HTTP(S).

No automatic offline service worker is included. The hosted site needs an initial network connection; all its application/font assets come from the same deployment. Keep the published player and HTML from the same build to avoid stale-manifest errors.

Reference: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
