export interface LiveData {
  generated: string;
  cf: { rating: number; max: number; rank: string; contests: number; history: number[]; asof: string; stale: boolean };
  lc: { rating: number; top: string; asof: string; stale: boolean };
  activity: { total: number; months: [string, number][]; asof: string; stale: boolean };
  ci: { label: string; ok: boolean; asof: string; stale?: boolean }[];
  commits: { date: string; repo: string; msg: string }[];
}

export function isLiveData(v: unknown): v is LiveData {
  const d = v as LiveData;
  return !!d && typeof d.generated === "string" && Array.isArray(d.cf?.history) && d.cf.history.length > 1
    && typeof d.cf.rating === "number" && Array.isArray(d.activity?.months) && d.activity.months.length === 12
    && Array.isArray(d.ci) && Array.isArray(d.commits) && typeof d.lc?.rating === "number";
}

export async function loadLive(): Promise<LiveData | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/profile-data.json`, { cache: "no-cache" });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return isLiveData(json) ? json : null;
  } catch {
    return null;
  }
}
