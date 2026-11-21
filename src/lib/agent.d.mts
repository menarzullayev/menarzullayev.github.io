import type { Cluster, Project, TimelineEvent } from "../content";
import type { Lang } from "../i18n";
import type { LiveData } from "../live";

export interface AgentInput {
  lang: Lang;
  ui: Record<string, string>;
  projects: Project[];
  clusters: Cluster[];
  timeline: TimelineEvent[];
  live: LiveData | null;
}
export const SITE: string;
export function publicProjects(projects: Project[]): Project[];
export function toPublicJson(input: AgentInput): Record<string, unknown>;
export function buildMarkdown(input: AgentInput): string;
export function buildLlms(input: Pick<AgentInput, "ui" | "projects" | "live">): string;
export function buildSitemap(langs: string[]): string;
