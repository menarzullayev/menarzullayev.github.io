# menarzullayev.github.io

Premium portfolio hub — catalog for ~100 interactive demos.

**Live:** https://menarzullayev.github.io

## Ecosystem (separate repos)

| Repo | Role |
|------|------|
| **menarzullayev.github.io** | Portfolio catalog hub (this repo) |
| **living-systems-atlas** | Lab OS vision — standalone experience |
| **experience-bible** | Design documentation — reference only |

## Add a demo

```json
{
  "id": "3d-rotate-text",
  "title": "3D Rotate Text",
  "category": "Animation",
  "tags": ["CSS", "3D", "JavaScript"],
  "status": "live",
  "description": {
    "en": "CSS 3D rotating text with mouse interaction.",
    "uz": "Sichqoncha bilan CSS 3D aylanuvchi matn.",
    "ru": "CSS 3D вращающийся текст с мышью."
  },
  "demo": "https://menarzullayev.github.io/demo-3d-rotate-text/",
  "repo": "https://github.com/menarzullayev/demo-3d-rotate-text"
}
```

## Local preview

```bash
python3 -m http.server 8020
```

Open http://localhost:8020
