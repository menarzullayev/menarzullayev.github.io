import { useMemo, useState } from "react";
import { clusters, projects, timeline } from "../content";
import { dictionaries, t, type Lang } from "../i18n";
import type { LiveData } from "../live";
import { buildMarkdown } from "../lib/agent.mjs";

const FILES = ["/index.md", "/llms.txt", "/data.json", "/sitemap.xml"];

export default function AgentView({ lang, live }: { lang: Lang; live: LiveData | null }) {
  const [copied, setCopied] = useState(false);
  const md = useMemo(() => buildMarkdown({ lang, ui: dictionaries[lang], projects, clusters, timeline, live }), [lang, live]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; the text stays selectable */
    }
  };
  return (
    <section className="agent" aria-label={t(lang, "agent.title")}>
      <h2>{t(lang, "agent.title")}</h2>
      <p className="muted">{t(lang, "agent.intro")}</p>
      <p>{t(lang, "agent.files")}: {FILES.map((f, i) => <span key={f}>{i ? " · " : ""}<a href={f}>{f}</a></span>)}</p>
      <button type="button" className="btn" onClick={copy}>{copied ? t(lang, "agent.copied") : t(lang, "agent.copy")}</button>
      <pre className="md" tabIndex={0}>{md}</pre>
    </section>
  );
}
