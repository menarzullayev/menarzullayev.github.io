import { timeline } from "../content";
import type { Lang } from "../i18n";

export default function Timeline({ lang }: { lang: Lang }) {
  return (
    <ol className="timeline">
      {timeline.map((e, i) => (
        <li key={i} className={`ev ev-${e.kind}`}>
          <time className="muted small" dateTime={e.date}>{e.date}</time>
          <span>{e.text[lang] || e.text.en}</span>
        </li>
      ))}
    </ol>
  );
}
