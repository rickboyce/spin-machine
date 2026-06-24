# AGENTS.md

Guidance for agent developers working on Spin Machine.

## Project Snapshot

Spin Machine is a small static web app for lightweight Friday team meeting rituals. It currently has a mode selector and two interactive modes:

- `site/index.html` - landing page and shared team setup.
- `site/modes/friday-flip.html` - category wheel, team selection, pass/nominate flow, and recent highlights.
- `site/modes/lucky-dip.html` - prompt capsule machine, vibe voting, timer, and editable theme pool.
- `site/assets/css/shared.css` - shared design tokens and reusable UI primitives.
- `site/assets/css/*.css` - page or mode-specific styling.
- `site/assets/js/shared.js` - shared utilities under `window.SpinMachine`.
- `site/assets/js/*.js` - page or mode-specific behavior.
- `dev/server.js` - tiny local static server for the `site/` directory.

There is no build step. GitHub Pages deploys the contents of `site/`.

## Local Development

Run a local static server from the repo root:

```sh
node dev/server.js
```

The default URL is `http://127.0.0.1:8000`. Use a different port when needed:

```sh
node dev/server.js 8124
```

You can also open `site/index.html` directly in a browser, but the local server is preferred for testing navigation and asset paths.

## Working Principles

Keep the project simple. This is a static site with plain HTML, CSS, and JavaScript, so avoid introducing build tooling, frameworks, package managers, or large abstractions unless the user explicitly asks and the value is obvious.

Prefer clean, readable code over cleverness. The app should remain easy to edit by someone scanning a single HTML, CSS, or JS file.

Reuse before copying. If a style, component pattern, team helper, audio helper, random selection helper, or storage behavior is useful in more than one place, put it in `shared.css` or `shared.js` and consume it from the mode files.

Keep styling consistent. Extend the existing visual language, spacing, typography, card treatments, buttons, and team-person controls rather than inventing unrelated variants. Shared UI elements should look and behave the same across modes.

Make focused changes. Avoid broad rewrites, unrelated refactors, formatting churn, or renaming files unless they directly support the task.

## HTML Conventions

- Keep each mode as a standalone HTML page under `site/modes/`.
- Load shared assets before mode-specific assets.
- Use relative paths that work from the current page location.
- Continue using Tailwind from the CDN for layout and small utility styling.
- Put reusable or repeated UI styling in CSS classes instead of duplicating long Tailwind class strings everywhere.
- Preserve accessible basics: semantic sections, button elements for actions, useful labels, `aria-live` where dynamic status changes matter, and real form controls for inputs.
- Avoid adding visible instructional copy unless it genuinely improves the experience.

## CSS Conventions

- Treat `site/assets/css/shared.css` as the design system.
- Reuse existing CSS custom properties such as `--primary`, `--primary-dark`, `--accent`, `--panel`, and `--ink`.
- Prefer shared classes for reusable primitives, including `app-shell`, `app-kicker`, `glass-card`, `icon-button`, `btn-pushable`, and team-person elements.
- Put mode-only layout and one-off effects in that mode's CSS file.
- Keep border radii, shadows, spacing, and typography aligned with existing patterns.
- Do not create near-duplicate button, card, badge, or team-member styles in multiple files. Promote shared patterns instead.
- Check responsive behavior. The app should work cleanly on mobile and desktop without overlapping text or controls.

## JavaScript Conventions

- Use plain browser JavaScript. Do not add dependencies unless there is a clear need.
- Keep shared helpers in `site/assets/js/shared.js` under `window.SpinMachine`.
- Use the existing helper exports where possible: `qs`, `getTeam`, `saveTeam`, `resizeTeam`, `capsuleSvg`, `weightedChoice`, `timeLabel`, and audio helpers.
- Keep mode state local to that mode's JS file.
- Prefer small named functions for UI rendering, state updates, and event handlers.
- Normalize and validate data read from `localStorage`.
- Avoid duplicating team-management logic across modes. Shared team behavior belongs in `shared.js`.
- Keep procedural audio optional and respectful of the existing mute controls.

## Adding A New Mode

When adding a new meeting mode:

1. Add a page under `site/modes/`.
2. Add mode-specific CSS and JS under `site/assets/css/` and `site/assets/js/`.
3. Load `../assets/css/shared.css` and `../assets/js/shared.js` first.
4. Reuse the existing team storage and team UI patterns where team participation is involved.
5. Add an entry on `site/index.html`.
6. Update `README.md` with the new mode and any notable behavior.

## Testing Checklist

Before handing work back:

- Run `node dev/server.js` and open the affected pages.
- Check `site/index.html` plus any changed mode page.
- Verify navigation links and relative asset paths.
- Exercise the main interaction path, not just page load.
- Check browser console errors.
- Check mobile and desktop widths.
- Confirm localStorage behavior still works for team setup or mode data.
- If changing shared CSS or JS, smoke test both existing modes.

## Deployment

The project deploys through GitHub Pages using `.github/workflows/pages.yml`. Since the deployed artifact is the static `site/` directory, make sure all runtime assets needed by the app live under `site/` or are intentionally loaded from a CDN.

## What To Avoid

- Do not add a build system for routine changes.
- Do not copy shared UI or team-management code into a mode file.
- Do not create a new visual style for every feature.
- Do not add heavy dependencies for simple interactions.
- Do not rewrite working mode logic while making unrelated UI changes.
- Do not hide important behavior inside dense inline event handlers.
- Do not leave broken links, unused files, or dead controls behind.

The north star: playful meeting tools, implemented with simple static files, shared primitives, consistent styling, and code that stays friendly to the next person who opens it.
