import type { ClusterId, Project, Status, Visibility } from "../content";

export interface GNode {
  id: string;
  cluster: ClusterId;
  visibility: Visibility;
  x: number;
  y: number;
  z: number;
}
export interface Filters {
  cluster: ClusterId | "all";
  status: Status | "all";
  visibility: Visibility | "all";
}
export const NO_FILTER: Filters = { cluster: "all", status: "all", visibility: "all" };

/** Hub positions in graph space (the centre node sits at the origin). */
export const HUBS: Record<ClusterId, [number, number, number]> = {
  edge: [-2.6, 1.3, 0.4],
  platforms: [2.6, 1.3, -0.4],
  verify: [-2.4, -1.5, -0.5],
  compete: [2.4, -1.5, 0.5],
  creative: [0, -3.0, -0.6],
};

/** Deterministic Fibonacci-sphere layout of the projects around their cluster hub. */
export function layout(projects: Project[]): GNode[] {
  const byCluster = new Map<ClusterId, Project[]>();
  for (const p of projects) byCluster.set(p.cluster, [...(byCluster.get(p.cluster) ?? []), p]);
  const nodes: GNode[] = [];
  for (const [cluster, list] of byCluster) {
    const [hx, hy, hz] = HUBS[cluster];
    const n = list.length;
    list.forEach((p, i) => {
      const k = (i + 0.5) / n;
      const phi = Math.acos(1 - 2 * k);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = 1.05 + (i % 2) * 0.25;
      nodes.push({
        id: p.id, cluster, visibility: p.visibility,
        x: hx + r * Math.sin(phi) * Math.cos(theta),
        y: hy + r * Math.cos(phi),
        z: hz + r * Math.sin(phi) * Math.sin(theta),
      });
    });
  }
  return nodes;
}

export function matches(p: Project, f: Filters): boolean {
  return (f.cluster === "all" || p.cluster === f.cluster) && (f.status === "all" || p.status === f.status) && (f.visibility === "all" || p.visibility === f.visibility);
}

export function filterIds(projects: Project[], f: Filters): Set<string> {
  return new Set(projects.filter((p) => matches(p, f)).map((p) => p.id));
}

export function distance(a: GNode, b: GNode): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
