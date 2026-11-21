export interface Milestones {
  first: [string, number] | null;
  cmSince: [string, number] | null;
  peak: [string, number] | null;
}

/** Key dates from a dated rating timeline: first contest, first rating of 1900 or more (Candidate Master), peak. */
export function milestones(timeline: [string, number][]): Milestones {
  if (timeline.length === 0) return { first: null, cmSince: null, peak: null };
  const first = timeline[0];
  const cmSince = timeline.find(([, r]) => r >= 1900) ?? null;
  const peak = timeline.reduce((best, cur) => (cur[1] > best[1] ? cur : best), timeline[0]);
  return { first, cmSince, peak };
}

/** Map a dated timeline to chart points inside a box; dates are placed by time, not by index. */
export function chartPoints(timeline: [string, number][], width: number, height: number, pad = 12): { x: number; y: number; date: string; rating: number }[] {
  if (timeline.length === 0) return [];
  const t = timeline.map(([d]) => Date.parse(d));
  const r = timeline.map(([, v]) => v);
  const t0 = Math.min(...t), t1 = Math.max(...t), r0 = Math.min(...r), r1 = Math.max(...r);
  const dt = Math.max(1, t1 - t0), dr = Math.max(1, r1 - r0);
  return timeline.map(([date, rating], i) => ({
    x: pad + ((t[i] - t0) / dt) * (width - 2 * pad),
    y: height - pad - ((rating - r0) / dr) * (height - 2 * pad),
    date, rating,
  }));
}
