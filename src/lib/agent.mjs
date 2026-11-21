// Plain ESM so that both the app (Vite) and the build script (Node) use the same code.
// Builds the machine-readable views: Markdown, llms.txt and a JSON document.

export const SITE = "https://menarzullayev.github.io";

const pick = (obj, lang) => (obj && (obj[lang] || obj.en)) || "";

export function publicProjects(projects) {
  return projects.filter((p) => p.visibility === "public");
}

/** A private project is described but never given a URL; the JSON copy keeps only generic fields. */
export function toPublicJson({ lang, ui, projects, clusters, timeline, live }) {
  return {
    name: "Saidakbar Narzullayev",
    role: ui["hero.eyebrow"],
    summary: `${ui["hero.line1"]} ${ui["hero.line2"]}`,
    language: lang,
    generated: live ? live.generated : null,
    competitive: live
      ? { codeforces: { rating: live.cf.rating, rank: live.cf.rank, contests: live.cf.contests, asof: live.cf.asof }, leetcode: { rating: live.lc.rating, top: live.lc.top, asof: live.lc.asof } }
      : null,
    clusters: clusters.map((c) => ({ id: c.id, name: ui[`cluster.${c.id}`] })),
    projects: projects.map((p) => ({
      id: p.id, cluster: p.cluster, visibility: p.visibility, status: p.status, since: p.since,
      name: p.name, url: p.visibility === "public" ? p.url || null : null, stack: p.stack,
      summary: pick(p.summary, lang), evidence: pick(p.evidence, lang) || null,
    })),
    timeline: timeline.map((e) => ({ date: e.date, text: pick(e.text, lang) })),
    ci: live ? live.ci.map((c) => ({ repo: c.label, passing: c.ok, asof: c.asof })) : [],
    contact: "https://linkedin.com/in/NarzullayevMe",
  };
}

export function buildMarkdown({ lang, ui, projects, clusters, timeline, live }) {
  const L = [];
  L.push(`# Saidakbar Narzullayev`, "", `${ui["hero.eyebrow"]}`, "", `${ui["hero.line1"]} ${ui["hero.line2"]}`, "");
  if (live) {
    L.push(`- Codeforces ${live.cf.rating} (${live.cf.rank}), ${live.cf.contests} rated contests, as of ${live.cf.asof}`);
    L.push(`- LeetCode ${live.lc.rating}, top ${live.lc.top}, as of ${live.lc.asof}${live.lc.stale ? " (last known value)" : ""}`);
    L.push(`- Public contributions, last 12 months: ${live.activity.total}`, "");
  }
  for (const c of clusters) {
    const list = projects.filter((p) => p.cluster === c.id);
    if (!list.length) continue;
    L.push(`## ${ui[`cluster.${c.id}`]}`, "");
    for (const p of list) {
      const name = p.visibility === "public" && p.url ? `[${p.name}](${p.url})` : `${p.name} (private)`;
      L.push(`- **${name}**, ${ui[`status.${p.status}`]}, since ${p.since}. ${pick(p.summary, lang)} Stack: ${p.stack.join(", ")}.${pick(p.evidence, lang) ? " " + pick(p.evidence, lang) : ""}`);
    }
    L.push("");
  }
  L.push(`## ${ui["timeline.title"]}`, "");
  for (const e of timeline) L.push(`- ${e.date}: ${pick(e.text, lang)}`);
  L.push("", `Contact: https://linkedin.com/in/NarzullayevMe`, "");
  return L.join("\n");
}

export function buildLlms({ ui, projects, live }) {
  const L = [`# Saidakbar Narzullayev`, "", `> ${ui["hero.eyebrow"]}. ${ui["hero.line1"]} ${ui["hero.line2"]}`, "", "## Key links", ""];
  L.push(`- [Profile (README)](https://github.com/menarzullayev): the short version`);
  L.push(`- [Markdown version of this site](${SITE}/index.md)`);
  L.push(`- [Same facts as JSON](${SITE}/data.json)`);
  L.push(`- [engineering-portfolio](https://github.com/menarzullayev/engineering-portfolio): four case studies`, "", "## Public projects", "");
  for (const p of publicProjects(projects)) if (p.url) L.push(`- [${p.name}](${p.url}): ${pick(p.summary, "en")}`);
  L.push("", "## Notes", "", "- Private projects are described on the site but their names, code and customers are not published.");
  if (live) L.push(`- Live numbers were generated on ${live.generated} from public APIs.`);
  L.push("");
  return L.join("\n");
}

export function buildSitemap(langs) {
  const urls = [SITE + "/", ...langs.map((l) => `${SITE}/?lang=${l}`), `${SITE}/index.md`, `${SITE}/llms.txt`, `${SITE}/data.json`];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
}
