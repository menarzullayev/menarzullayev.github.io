import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { clusters, projects, timeline } from "../src/content";
import { LANGS, detectLang, dictionaries, t } from "../src/i18n";
import { NO_FILTER, distance, filterIds, layout, HUBS } from "../src/lib/graph";
import { buildLlms, buildMarkdown, buildSitemap, toPublicJson } from "../src/lib/agent.mjs";
import { isLiveData, type LiveData } from "../src/live";
import { looksValid } from "../scripts/prepare-data.mjs";

const live = JSON.parse(readFileSync("public/data/profile-data.json", "utf8")) as LiveData;
const input = (lang: (typeof LANGS)[number]) => ({ lang, ui: dictionaries[lang], projects, clusters, timeline, live });

// Names that must never appear anywhere in the published content: private repositories, customers, internal systems.
const BANNED = [/edge-comnex/i, /cv-alg/i, /tezkino/i, /finos/i, /annotation-studio/i, /sammu/i, /attendance/i, /dualsamkiut/i, /medzamin/i, /comnex/i, /\.env/i, /password/i, /secret/i, /token/i];

describe("i18n", () => {
  it("has the same keys in every language", () => {
    const en = Object.keys(dictionaries.en).sort();
    for (const l of LANGS) expect(Object.keys(dictionaries[l]).sort(), l).toEqual(en);
  });
  it("has no empty strings and keeps the same placeholders", () => {
    for (const key of Object.keys(dictionaries.en)) {
      const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
      for (const l of LANGS) {
        expect(dictionaries[l][key].trim().length, `${l}:${key}`).toBeGreaterThan(0);
        expect(vars(dictionaries[l][key]), `${l}:${key}`).toBe(vars(dictionaries.en[key]));
      }
    }
  });
  it("fills variables and falls back to English", () => {
    expect(t("en", "hero.badge.cf", { rating: 2013 })).toContain("2013");
    expect(t("uz", "no.such.key")).toBe("no.such.key");
  });
  it("detects the language: URL, then storage, then browser, then English", () => {
    expect(detectLang("?lang=ru", "uz", "en-US")).toBe("ru");
    expect(detectLang("", "uz", "en-US")).toBe("uz");
    expect(detectLang("", null, "ru-RU")).toBe("ru");
    expect(detectLang("?lang=xx", "yy", "de-DE")).toBe("en");
  });
});

describe("content", () => {
  it("has unique ids and known clusters", () => {
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length);
    const ids = new Set(clusters.map((c) => c.id));
    for (const p of projects) expect(ids.has(p.cluster), p.id).toBe(true);
  });
  it("has text in all three languages", () => {
    for (const p of projects) for (const l of LANGS) expect(p.summary[l].trim().length, `${p.id}:${l}`).toBeGreaterThan(10);
    for (const e of timeline) for (const l of LANGS) expect(e.text[l].trim().length).toBeGreaterThan(5);
  });
  it("gives private projects no URL and public ones an allowed host", () => {
    const ok = /^https:\/\/(github\.com\/menarzullayev|nerc\.itmo\.ru|codeforces\.com\/profile\/meNarzullayev|leetcode\.com\/u\/NarzullayevMe)/;
    for (const p of projects) {
      if (p.visibility === "private") expect(p.url, p.id).toBeUndefined();
      else expect(p.url ?? "", p.id).toMatch(ok);
    }
  });
  it("sorts the timeline", () => {
    const dates = timeline.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });
  it("never mentions private names, customers or secrets (all content files)", () => {
    for (const dir of ["src/content"]) {
      for (const f of readdirSync(dir)) {
        const text = readFileSync(`${dir}/${f}`, "utf8");
        for (const re of BANNED) expect(text, `${f} matches ${re}`).not.toMatch(re);
      }
    }
  });
});

describe("graph layout", () => {
  const nodes = layout(projects);
  it("is deterministic and complete", () => {
    expect(layout(projects)).toEqual(nodes);
    expect(nodes.length).toBe(projects.length);
  });
  it("keeps nodes apart and near their hub", () => {
    for (let i = 0; i < nodes.length; i++) {
      const [hx, hy, hz] = HUBS[nodes[i].cluster];
      expect(Math.hypot(nodes[i].x - hx, nodes[i].y - hy, nodes[i].z - hz)).toBeLessThan(1.5);
      for (let j = i + 1; j < nodes.length; j++) expect(distance(nodes[i], nodes[j]), `${nodes[i].id}/${nodes[j].id}`).toBeGreaterThan(0.25);
    }
  });
  it("filters by cluster, status and visibility", () => {
    expect(filterIds(projects, NO_FILTER).size).toBe(projects.length);
    expect([...filterIds(projects, { ...NO_FILTER, cluster: "edge" })].sort()).toEqual(projects.filter((p) => p.cluster === "edge").map((p) => p.id).sort());
    const priv = filterIds(projects, { ...NO_FILTER, visibility: "private" });
    for (const id of priv) expect(projects.find((p) => p.id === id)!.visibility).toBe("private");
    expect(filterIds(projects, { cluster: "edge", status: "research", visibility: "all" }).size).toBe(0);
  });
});

describe("agent views", () => {
  it("lists every public URL and no private project URL in Markdown", () => {
    const md = buildMarkdown(input("en"));
    for (const p of projects.filter((x) => x.visibility === "public")) expect(md, p.id).toContain(p.url!);
    for (const p of projects.filter((x) => x.visibility === "private")) expect(md, p.id).toContain(`${p.name} (private)`);
  });
  it("nulls the URL of private projects in JSON and keeps the language", () => {
    for (const l of LANGS) {
      const j = toPublicJson(input(l)) as { language: string; projects: { visibility: string; url: string | null }[] };
      expect(j.language).toBe(l);
      for (const p of j.projects.filter((x) => x.visibility === "private")) expect(p.url).toBeNull();
    }
  });
  it("leaks nothing banned in any generated text", () => {
    const all = LANGS.flatMap((l) => [buildMarkdown(input(l)), JSON.stringify(toPublicJson(input(l)))]).concat(buildLlms(input("en")), buildSitemap([...LANGS]));
    for (const text of all) for (const re of BANNED) expect(text).not.toMatch(re);
  });
  it("llms.txt links only public projects", () => {
    const txt = buildLlms(input("en"));
    for (const p of projects.filter((x) => x.visibility === "private")) expect(txt).not.toContain(p.name);
    expect(txt).toContain("/data.json");
  });
  it("sitemap has a URL for every language", () => {
    const s = buildSitemap([...LANGS]);
    for (const l of LANGS) expect(s).toContain(`?lang=${l}`);
  });
});

describe("live data guard", () => {
  it("accepts the real data and rejects broken shapes", () => {
    expect(isLiveData(live)).toBe(true);
    expect(looksValid(live)).toBe(true);
    const broken = [{}, null, { ...live, activity: { ...live.activity, months: [] } }, { ...live, cf: { ...live.cf, history: [1] } }, { ...live, ci: "x" }];
    for (const b of broken) {
      expect(isLiveData(b)).toBe(false);
      expect(looksValid(b)).toBe(false);
    }
  });
});
