# menarzullayev.github.io

Interactive profile site of Saidakbar Narzullayev: a 3D project graph you can drag, filters, live public statistics, a timeline, and a plain-text agent view. English, Uzbek and Russian.

Live: https://menarzullayev.github.io · Short version: https://github.com/menarzullayev

## What is in it

| Part | How it works |
|---|---|
| Project graph | `three` scene, drag nodes, drag the background to rotate, click for details; a list view and keyboard-reachable buttons give the same projects without WebGL |
| Filters | cluster, status, public or private; the graph dims what does not match |
| Live statistics | `public/data/profile-data.json`, refreshed at build from the profile repository (Codeforces and LeetCode APIs, GitHub API, CI of the default branch) |
| Human / Agent | the agent view is the same facts as Markdown; `/index.md`, `/llms.txt`, `/data.json` (and `.uz`, `.ru`) are generated at build |
| Languages | `src/content/ui.{en,uz,ru}.json`; English is the reference, Uzbek and Russian are machine-assisted drafts |

Private projects are described generically (no names of customers or repositories, no URLs). `tests/site.test.ts` fails the build if a banned name appears in any content or generated file.

## Commands

```
npm ci --ignore-scripts
npm test          # content, i18n, layout, agent files, leak checks
npm run build     # fetch live data, type-check, bundle, write machine-readable files
npm run preview
```

## Deploy

`.github/workflows/pages.yml` builds and deploys with GitHub Pages (source: GitHub Actions) on every push to `main` and daily. The earlier demo hub is kept in `archive/` and served at `/archive/`.

## Privacy

No analytics, no third-party scripts, fonts and data are served from this origin; the page's Content-Security-Policy allows only `self`.
