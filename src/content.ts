import raw from "./content/projects.json";
import timelineRaw from "./content/timeline.json";
import type { Lang } from "./i18n";

export type ClusterId = "edge" | "platforms" | "verify" | "compete" | "creative";
export type Status = "live" | "dev" | "done" | "research";
export type Visibility = "public" | "private";
export type I18n = Record<Lang, string>;

export interface Project {
  id: string;
  cluster: ClusterId;
  visibility: Visibility;
  status: Status;
  since: string;
  name: string;
  url?: string;
  stack: string[];
  summary: I18n;
  evidence: I18n;
}
export interface Cluster {
  id: ClusterId;
  color: string;
}
export interface TimelineEvent {
  date: string;
  kind: string;
  text: I18n;
}

export const clusters = raw.clusters as Cluster[];
export const projects = raw.projects as Project[];
export const timeline = (timelineRaw.events as TimelineEvent[]).slice().sort((a, b) => a.date.localeCompare(b.date));
export const STATUSES: Status[] = ["live", "dev", "done", "research"];
