// Fetch the live profile data (written daily by the profile repo's workflow) into public/data.
// On any failure the committed copy stays in place and a warning is printed.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = `${root}/public/data/profile-data.json`;
const url = "https://raw.githubusercontent.com/menarzullayev/menarzullayev/main/data/profile-data.json";
const compUrl = "https://raw.githubusercontent.com/menarzullayev/menarzullayev/main/data/competitions.json";
const compTarget = `${root}/public/data/competitions.json`;

export function looksValid(d) {
  return !!d && typeof d.generated === "string" && Array.isArray(d.cf?.history) && d.cf.history.length > 1
    && typeof d.cf.rating === "number" && Array.isArray(d.activity?.months) && d.activity.months.length === 12
    && Array.isArray(d.ci) && d.ci.length > 0 && Array.isArray(d.commits) && typeof d.lc?.rating === "number";
}

export function looksValidCompetitions(c) {
  return !!c && Array.isArray(c.icpc?.entries) && c.icpc.entries.length > 0 && c.icpc.entries.every((e) => typeof e.year === "number" && String(e.url).startsWith("https://"))
    && String(c.codeforces?.url).startsWith("https://") && String(c.leetcode?.url).startsWith("https://");
}

async function refresh(source, file, valid, label) {
  try {
    const res = await fetch(source, { headers: { "User-Agent": "menarzullayev-site-build" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!valid(data)) throw new Error("unexpected data shape");
    writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    console.log(`${label} refreshed`);
  } catch (err) {
    console.warn(`warning: could not refresh ${label} (${err.message}); keeping the committed copy`);
  }
}

async function main() {
  await refresh(compUrl, compTarget, looksValidCompetitions, "competition record");
  mkdirSync(dirname(target), { recursive: true });
  try {
    const res = await fetch(url, { headers: { "User-Agent": "menarzullayev-site-build" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!looksValid(data)) throw new Error("unexpected data shape");
    writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
    console.log(`profile data refreshed (generated ${data.generated})`);
  } catch (err) {
    const kept = JSON.parse(readFileSync(target, "utf8"));
    console.warn(`warning: could not refresh profile data (${err.message}); keeping the committed copy from ${kept.generated}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
