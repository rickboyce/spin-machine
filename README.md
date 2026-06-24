# Spin Machine

Static meeting tools for Friday team rituals.

## Modes

- **The Friday Flip** (`site/modes/friday-flip.html`): spins a category wheel, selects a present team member, supports pass/nominate, tracks recent highlights, and plays lightweight procedural audio.
- **Friday Vibe Lucky Dip** (`site/modes/lucky-dip.html`): draws a random storytelling prompt, lets the team vote on the vibe, includes a speaker timer, and provides an editable theme pool.

Open `site/index.html` to choose a mode.

## Structure

- `site/index.html` - mode selector landing page.
- `site/modes/` - standalone pages for each meeting mode.
- `site/assets/css/` - shared and mode-specific styles.
- `site/assets/js/` - shared utilities and mode-specific app logic.
- `.github/workflows/pages.yml` - GitHub Pages deployment workflow.

No build step is required; serve the folder with any static web server.

## GitHub Pages

In the repository settings, publish GitHub Pages with:

- Source: `GitHub Actions`

The workflow deploys the static contents of `site/` whenever `main` is updated.
