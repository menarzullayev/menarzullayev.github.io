import { useEffect, useState } from "react";
import AgentView from "./components/AgentView";
import Explorer from "./components/Explorer";
import Stats from "./components/Stats";
import Timeline from "./components/Timeline";
import { LANGS, LANG_LABEL, detectLang, t, type Lang } from "./i18n";
import Record from "./components/Record";
import { loadCompetitions, loadLive, type Competitions, type LiveData } from "./live";

type Mode = "human" | "agent";

const safeGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* private mode: the choice just is not remembered */ }
};

export default function App() {
  const [lang, setLang] = useState<Lang>(() => detectLang(location.search, safeGet("lang"), navigator.language || "en"));
  const [mode, setMode] = useState<Mode>(() => (new URLSearchParams(location.search).get("mode") === "agent" ? "agent" : "human"));
  const [live, setLive] = useState<LiveData | null>(null);
  const [competitions, setCompetitions] = useState<Competitions | null>(null);

  useEffect(() => { void loadLive().then(setLive); void loadCompetitions().then(setCompetitions); }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t(lang, "meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", t(lang, "meta.description"));
    safeSet("lang", lang);
  }, [lang]);

  const pickLang = (l: Lang) => {
    setLang(l);
    const u = new URL(location.href);
    u.searchParams.set("lang", l);
    history.replaceState(null, "", u);
  };
  const pickMode = (m: Mode) => {
    setMode(m);
    const u = new URL(location.href);
    if (m === "agent") u.searchParams.set("mode", "agent"); else u.searchParams.delete("mode");
    history.replaceState(null, "", u);
  };

  return (
    <>
      <a className="skip" href="#main">{t(lang, "skip")}</a>
      <header className="top">
        <span className="brand">menarzullayev<span className="cur">_</span></span>
        <nav aria-label="mode and language">
          <span role="group" aria-label="mode">
            {(["human", "agent"] as Mode[]).map((m) => (
              <button key={m} type="button" className={`tog${mode === m ? " on" : ""}`} aria-pressed={mode === m} onClick={() => pickMode(m)}>{t(lang, `mode.${m}`)}</button>
            ))}
          </span>
          <span role="group" aria-label="language">
            {LANGS.map((l) => (
              <button key={l} type="button" className={`tog${lang === l ? " on" : ""}`} aria-pressed={lang === l} lang={l} onClick={() => pickLang(l)}>{LANG_LABEL[l]}</button>
            ))}
          </span>
        </nav>
      </header>

      <main id="main">
        <section className="hero">
          <p className="eyebrow">&gt; {t(lang, "hero.eyebrow")}</p>
          <h1>Saidakbar Narzullayev</h1>
          <p className="lead">&gt; {t(lang, "hero.line1")}<br />&nbsp;&nbsp;{t(lang, "hero.line2")}</p>
          <p className="badges">
            <span>[ {t(lang, "hero.badge.icpc")} ]</span>
            {live && <span>[ {t(lang, "hero.badge.cf", { rating: live.cf.rating })} ]</span>}
            {live && <span>[ {t(lang, "hero.badge.lc", { rating: live.lc.rating, top: live.lc.top })} ]</span>}
          </p>
          <svg className="trace" viewBox="0 0 800 70" aria-hidden="true" preserveAspectRatio="none">
            <defs><linearGradient id="tr" x1="0" x2="1"><stop offset="0" stopColor="var(--a1)" /><stop offset=".5" stopColor="var(--a2)" /><stop offset="1" stopColor="var(--a4)" /></linearGradient></defs>
            <path d="M0 52 C70 52,90 14,170 20 S290 62,370 40 S500 6,590 24 S700 52,800 14" fill="none" stroke="url(#tr)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </section>

        {mode === "agent" ? (
          <AgentView lang={lang} live={live} competitions={competitions} />
        ) : (
          <>
            <section aria-labelledby="h-graph"><h2 id="h-graph">{t(lang, "graph.title")}</h2><Explorer lang={lang} /></section>
            <section aria-labelledby="h-stats"><h2 id="h-stats">{t(lang, "stats.title")}</h2><Stats lang={lang} live={live} /></section>
            <section aria-labelledby="h-record"><h2 id="h-record">{t(lang, "record.title")}</h2><Record lang={lang} live={live} competitions={competitions} /></section>
            <section aria-labelledby="h-time"><h2 id="h-time">{t(lang, "timeline.title")}</h2><Timeline lang={lang} /></section>
          </>
        )}
      </main>

      <footer>
        <p>{t(lang, "footer.built")}</p>
        <p className="muted small">{t(lang, "footer.translations")}</p>
        <p className="small">
          <a href="https://github.com/menarzullayev/menarzullayev.github.io">{t(lang, "footer.source")}</a> · <a href="https://github.com/menarzullayev">GitHub</a> · <a href="https://linkedin.com/in/NarzullayevMe">LinkedIn</a> · <a href="/archive/">{t(lang, "footer.archive")}</a>
        </p>
      </footer>
    </>
  );
}
