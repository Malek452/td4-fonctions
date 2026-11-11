# Dependency maintenance

Use Node 24 and the committed lockfile. Run `npm ci`, then `npm run validate` after any dependency change. Do not use `npm audit fix --force` as a substitute for compatibility testing.

## Current compatibility boundary

Motion Canvas 3.17.2's official Vite plugin declares `vite: 4.x || 5.x`. This template keeps Vite 5.4.21 to stay within that declared range. That Vite line and its nested esbuild version still produce known development-tool advisories in `npm audit`. The plugin is also reported through that dependency chain. The template is **not claimed to have a clean full dependency audit**.

The affected development tools are not deployed as servers: `dist/` is a static build. Keep the authoring server local, use trusted source material, and do not expose the Vite or Motion Canvas editor server as the public presentation. `npm run dev` and `npm run preview` bind to localhost by default. Only explicitly add `--host` for a trusted preview environment when needed.

KaTeX is updated to 0.19.1. A targeted npm `overrides` entry selects patched xmldom 0.9.12 because the transitive speech-rule-engine package pins 0.9.10 exactly. This is a patch-level XML-library update, not a Vite peer-range bypass. These changes are separate from the Motion Canvas timing code. `npm audit --omit=dev` checks the production dependency tree; review its actual output rather than assuming it will remain unchanged.

Before migrating Vite, either adopt an upstream Motion Canvas plugin that officially supports the new version, or deliberately maintain and test a compatible plugin replacement. Do not hide peer conflicts with `--legacy-peer-deps` or claim an unsupported upgrade is verified without checking the editor, animation build, player and React app.

Relevant upstream references:

- [Motion Canvas Vite plugin package](https://github.com/motion-canvas/motion-canvas/blob/v3.17.2/packages/vite-plugin/package.json)
- [Motion Canvas releases](https://github.com/motion-canvas/motion-canvas/releases)
- [Vite security advisories](https://github.com/vitejs/vite/security/advisories)
- [KaTeX releases](https://github.com/KaTeX/KaTeX/releases)

## Regression checks that matter

- Keep absolute frame scheduling and seek serialization intact; run the long-sequence timing regression at 0.5×, 1× and 1.5×.
- Check compilation from a clean install, including regeneration of glyphs and the player manifest.
- Review the actual browser transition when changing glyph matching, focus, semantic operations or timing. Automatic geometry tests are not a visual audit.
- Validate imported mathematics independently. The sample tests do not become universal verification just because an activity has the same data shape.
