// After `vite build`: write the machine-readable views next to the app in dist/.
import { copyFileSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLlms, buildMarkdown, buildSitemap, toPublicJson } from "../src/lib/agent.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => JSON.parse(readFileSync(`${root}/${p}`, "utf8"));
const out = (name, text) => writeFileSync(`${root}/dist/${name}`, text);

const langs = ["en", "uz", "ru"];
const projectsFile = read("src/content/projects.json");
const timeline = read("src/content/timeline.json").events.slice().sort((a, b) => a.date.localeCompare(b.date));
const live = read("public/data/profile-data.json");
const competitions = read("public/data/competitions.json");

for (const lang of langs) {
  const ui = read(`src/content/ui.${lang}.json`);
  const input = { lang, ui, projects: projectsFile.projects, clusters: projectsFile.clusters, timeline, live, competitions };
  const suffix = lang === "en" ? "" : `.${lang}`;
  out(`index${suffix}.md`, buildMarkdown(input));
  out(`data${suffix}.json`, JSON.stringify(toPublicJson(input), null, 2) + "\n");
  if (lang === "en") out("llms.txt", buildLlms(input));
}
out("sitemap.xml", buildSitemap(langs));
copyFileSync(`${root}/dist/index.html`, `${root}/dist/404.html`);
cpSync(`${root}/archive`, `${root}/dist/archive`, { recursive: true });
console.log("agent files written: index(.uz|.ru).md, data(.uz|.ru).json, llms.txt, sitemap.xml, 404.html, archive/");
