import { useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { LiveData } from "../live";

interface Props { lang: Lang; live: LiveData | null }

export default function Stats({ lang, live }: Props) {
  const [tip, setTip] = useState<string | null>(null);
  if (!live) return <p className="muted">…</p>;
  const { activity, cf, ci, commits } = live;
  const max = Math.max(2000, ...activity.months.map(([, v]) => v));
  const lo = Math.min(...cf.history), hi = Math.max(...cf.history), span = Math.max(1, hi - lo);
  const pts = cf.history.map((v, i) => [10 + (i * 280) / (cf.history.length - 1), 90 - ((v - lo) / span) * 60] as const);
  const asof = (d: string, stale?: boolean) => `${t(lang, "stats.asof", { date: d })}${stale ? ` · ${t(lang, "stats.stale")}` : ""}`;

  return (
    <div className="stats-grid">
      <section className="card" aria-label={t(lang, "stats.activity")}>
        <h3>{t(lang, "stats.activity")}</h3>
        <p className="big">{activity.total.toLocaleString("en-US")}</p>
        <p className="muted small">{t(lang, "stats.activity.note")} · {asof(activity.asof, activity.stale)}</p>
        <svg viewBox="0 0 330 120" role="img" aria-label={t(lang, "stats.activity")} className="chart" onMouseLeave={() => setTip(null)}>
          {activity.months.map(([m, v], i) => {
            const h = Math.max(2, (v / max) * 84);
            return (
              <g key={i} onMouseEnter={() => setTip(`${m}: ${v}`)} tabIndex={0} onFocus={() => setTip(`${m}: ${v}`)} onBlur={() => setTip(null)}>
                <rect x={10 + i * 26} y={100 - h} width="18" height={h} rx="2" fill="var(--a1)" opacity={0.45 + (0.5 * v) / max} />
                <text x={10 + i * 26 + 9} y="114" textAnchor="middle" className="axis">{m}</text>
              </g>
            );
          })}
        </svg>
        <p className="muted small tip" aria-live="polite">{tip ?? " "}</p>
      </section>

      <section className="card" aria-label={t(lang, "stats.cf")}>
        <h3>{t(lang, "stats.cf")}</h3>
        <p className="big">{cf.rating}</p>
        <p className="muted small">{t(lang, "stats.cf.note", { rank: cf.rank, contests: cf.contests })} · {asof(cf.asof, cf.stale)}</p>
        <svg viewBox="0 0 300 100" role="img" aria-label={t(lang, "stats.cf")} className="chart">
          <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--a2)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2.5} fill="var(--a2)">
              <title>{cf.history[i]}</title>
            </circle>
          ))}
        </svg>
        <p className="muted small">LeetCode {live.lc.rating} · top {live.lc.top} · {asof(live.lc.asof, live.lc.stale)}</p>
      </section>

      <section className="card" aria-label={t(lang, "stats.ci")}>
        <h3>{t(lang, "stats.ci")}</h3>
        <ul className="ci">
          {ci.map((r) => (
            <li key={r.label}>
              <span className={r.ok ? "dot ok" : "dot bad"} aria-hidden="true" />
              <span>{r.label}</span>
              <span className={r.ok ? "muted small" : "bad small"}>{r.ok ? t(lang, "stats.pass") : t(lang, "stats.fail")} · {r.asof}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-label={t(lang, "stats.commits")}>
        <h3>{t(lang, "stats.commits")}</h3>
        <ul className="commits">
          {commits.map((c, i) => (
            <li key={i}>
              <span className="muted small">{c.date}</span> <strong>{c.repo}</strong>
              <br /><span className="muted small">{c.msg}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
