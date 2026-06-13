# menarzullayev.github.io

Premium portfolio hub for ~100 interactive demos.

**Live:** https://menarzullayev.github.io

## Workflow

1. Build demo locally and test
2. Create `demo-project-name` repo and enable GitHub Pages
3. Add entry to `projects.json`:

```json
{
  "id": "3d-rotate-text",
  "title": "3D Rotate Text",
  "description": "CSS 3D rotating Coming Soon text with mouse interaction.",
  "category": "Animation",
  "tags": ["CSS", "3D", "JavaScript"],
  "status": "live",
  "demo": "https://menarzullayev.github.io/demo-3d-rotate-text/",
  "repo": "https://github.com/menarzullayev/demo-3d-rotate-text"
}
```

4. Push hub repo — catalog updates automatically

## Features

- EN / UZ / RU language switch
- Dark / Light theme toggle
- Search + category + tag filters
- Particle background
- Empty state ready for gradual publishing

## Local preview

```bash
cd menarzullayev.github.io
python3 -m http.server 8020
```

Open http://localhost:8020
