import { useState } from "react";
import { t, type Lang } from "../i18n";
import type { Competitions, LiveData } from "../live";
import { chartPoints, milestones } from "../lib/record";

interface Props { lang: Lang; live: LiveData | null; competitions: Competitions | null }

export default function Record({ lang, live, competitions }: Props) {
  const [tip, setTip] = useState<string | null>(null);
  const timeline = live?.cf.timeline ?? [];
  const pts = chartPoints(timeline, 640, 190);
  const ms = milestones(timeline);

  return (
    <div className="record">
      <section className="card" aria-label={t(lang, "record.icpc")}>
        <h3>{t(lang, "record.icpc")}</h3>
        {competitions ? (
          <>
            <ul className="icpc">
              {competitions.icpc.entries.map((e) => (
                <li key={e.year}>
                  <strong>{e.year}</strong> <span className="muted">{e.team}</span>{" "}
                  <a href={e.url} target="_blank" rel="noopener noreferrer">{t(lang, "record.standings")} ↗</a>
                </li>
              ))}
            </ul>
            <p className="muted small">{t(lang, "record.icpc.note")}</p>
          </>
        ) : (
          <p className="muted">…</p>
        )}
      </section>

      <section className="card" aria-label={t(lang, "record.cf")}>
        <h3>{t(lang, "record.cf")}</h3>
        {live ? (
          <>
            <p className="big">{live.cf.rating}</p>
            {pts.length > 1 ? (
              <svg viewBox="0 0 640 190" role="img" aria-label={t(lang, "record.cf")} className="chart" onMouseLeave={() => setTip(null)}>
                <polyline points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} fill="none" stroke="var(--a2)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--a2)" opacity="0.9" tabIndex={0}
                    onMouseEnter={() => setTip(`${p.date}: ${p.rating}`)} onFocus={() => setTip(`${p.date}: ${p.rating}`)} onBlur={() => setTip(null)}>
                    <title>{`${p.date}: ${p.rating}`}</title>
                  </circle>
                ))}
              </svg>
            ) : (
              <p className="muted small">{t(lang, "record.nohistory")}</p>
            )}
            <p className="muted small tip" aria-live="polite">{tip ?? " "}</p>
            <ul className="miles">
              {ms.first && <li>{t(lang, "record.first", { date: ms.first[0] })}</li>}
              {ms.cmSince && <li>{t(lang, "record.cm", { date: ms.cmSince[0], rating: ms.cmSince[1] })}</li>}
              {ms.peak && <li>{t(lang, "record.peak", { rating: ms.peak[1], date: ms.peak[0] })}</li>}
            </ul>
            {competitions && (
              <p className="small">
                <a href={competitions.codeforces.url} target="_blank" rel="noopener noreferrer">Codeforces ↗</a> ·{" "}
                <a href={competitions.leetcode.url} target="_blank" rel="noopener noreferrer">LeetCode ↗</a>
              </p>
            )}
          </>
        ) : (
          <p className="muted">…</p>
        )}
      </section>
    </div>
  );
}
