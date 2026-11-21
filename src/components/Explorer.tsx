import { Suspense, lazy, useMemo, useState } from "react";
import { STATUSES, clusters, projects, type ClusterId, type Project, type Status, type Visibility } from "../content";
import { NO_FILTER, filterIds, matches, type Filters } from "../lib/graph";
import { t, type Lang } from "../i18n";

const Graph3D = lazy(() => import("./Graph3D"));

function Chip<T extends string>({ value, current, onPick, label }: { value: T; current: T; onPick: (v: T) => void; label: string }) {
  return (
    <button type="button" className={`chip${value === current ? " on" : ""}`} aria-pressed={value === current} onClick={() => onPick(value)}>{label}</button>
  );
}

function Panel({ p, lang, onClose }: { p: Project; lang: Lang; onClose: () => void }) {
  return (
    <aside className="panel" aria-label={p.name}>
      <button type="button" className="close" onClick={onClose} aria-label={t(lang, "panel.close")}>×</button>
      <h3>{p.name}</h3>
      <p className="muted small">{t(lang, `cluster.${p.cluster}`)} · {t(lang, `status.${p.status}`)}</p>
      <p>{p.summary[lang] || p.summary.en}</p>
      <dl>
        <dt>{t(lang, "panel.stack")}</dt><dd>{p.stack.join(" · ")}</dd>
        <dt>{t(lang, "panel.since")}</dt><dd>{p.since}</dd>
        {(p.evidence[lang] || p.evidence.en) && (<><dt>{t(lang, "panel.evidence")}</dt><dd>{p.evidence[lang] || p.evidence.en}</dd></>)}
      </dl>
      {p.visibility === "public" && p.url ? (
        <a className="btn" href={p.url} target="_blank" rel="noopener noreferrer">{t(lang, "panel.open")} ↗</a>
      ) : (
        <p className="muted small">{t(lang, "panel.private")}</p>
      )}
    </aside>
  );
}

export default function Explorer({ lang }: { lang: Lang }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTER);
  const [selected, setSelected] = useState<string | null>(null);
  const [asList, setAsList] = useState(false);
  const visible = useMemo(() => filterIds(projects, filters), [filters]);
  const current = projects.find((p) => p.id === selected) ?? null;
  const list = projects.filter((p) => matches(p, filters));
  const set = <K extends keyof Filters>(k: K) => (v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="explorer">
      <div className="filters" role="group" aria-label={t(lang, "graph.title")}>
        <div role="group" aria-label={t(lang, "filter.cluster")}>
          <Chip<ClusterId | "all"> value="all" current={filters.cluster} onPick={set("cluster")} label={t(lang, "filter.all")} />
          {clusters.map((c) => <Chip<ClusterId | "all"> key={c.id} value={c.id} current={filters.cluster} onPick={set("cluster")} label={t(lang, `cluster.${c.id}`)} />)}
        </div>
        <div role="group" aria-label={t(lang, "filter.status")}>
          <Chip<Status | "all"> value="all" current={filters.status} onPick={set("status")} label={t(lang, "filter.all")} />
          {STATUSES.map((s) => <Chip<Status | "all"> key={s} value={s} current={filters.status} onPick={set("status")} label={t(lang, `status.${s}`)} />)}
        </div>
        <div role="group" aria-label={t(lang, "filter.visibility")}>
          <Chip<Visibility | "all"> value="all" current={filters.visibility} onPick={set("visibility")} label={t(lang, "filter.all")} />
          <Chip<Visibility | "all"> value="public" current={filters.visibility} onPick={set("visibility")} label={t(lang, "filter.public")} />
          <Chip<Visibility | "all"> value="private" current={filters.visibility} onPick={set("visibility")} label={t(lang, "filter.private")} />
          <button type="button" className="chip view" aria-pressed={asList} onClick={() => setAsList((v) => !v)}>{asList ? t(lang, "graph.canvas") : t(lang, "graph.list")}</button>
        </div>
      </div>

      {!asList && (
        <div className="stage">
          <Suspense fallback={<div className="g3d"><p className="muted small">…</p></div>}>
            <Graph3D
              projects={projects} clusters={clusters} visible={visible} selected={selected} onSelect={setSelected}
              clusterLabel={(id) => t(lang, `cluster.${id}`)} nameOf={(id) => projects.find((p) => p.id === id)?.name ?? id}
              fallback={t(lang, "graph.nowebgl")}
            />
          </Suspense>
          <p className="muted small hint">{t(lang, "graph.hint")}</p>
          <p className="legend small muted"><span className="swatch solid" /> {t(lang, "graph.legend.public")} <span className="swatch dashed" /> {t(lang, "graph.legend.private")}</p>
        </div>
      )}

      <ul className="plist" aria-label={t(lang, "graph.list")}>
        {list.length === 0 && <li className="muted">{t(lang, "filter.none")}</li>}
        {list.map((p) => (
          <li key={p.id}>
            <button type="button" className={`pbtn${p.id === selected ? " on" : ""}`} onClick={() => setSelected(p.id === selected ? null : p.id)} aria-pressed={p.id === selected}>
              <span className="swatch-c" style={{ background: clusters.find((c) => c.id === p.cluster)?.color }} aria-hidden="true" />
              <strong>{p.name}</strong>
              <span className="muted small">{t(lang, `status.${p.status}`)} · {p.visibility === "private" ? t(lang, "filter.private") : t(lang, "filter.public")}</span>
            </button>
          </li>
        ))}
      </ul>

      {current && <Panel p={current} lang={lang} onClose={() => setSelected(null)} />}
    </div>
  );
}
