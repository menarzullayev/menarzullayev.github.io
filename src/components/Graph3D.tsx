import { useEffect, useRef, useState } from "react";
import {
  BufferAttribute, BufferGeometry, Color, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial,
  PerspectiveCamera, Plane, Raycaster, Scene, SphereGeometry, Vector2, Vector3, WebGLRenderer,
} from "three";
import type { Cluster, ClusterId, Project } from "../content";
import { HUBS, layout } from "../lib/graph";

interface Props {
  projects: Project[];
  clusters: Cluster[];
  visible: Set<string>;
  selected: string | null;
  onSelect: (id: string | null) => void;
  clusterLabel: (id: ClusterId) => string;
  nameOf: (id: string) => string;
  fallback: string;
}

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Graph3D({ projects, clusters, visible, selected, onSelect, clusterLabel, nameOf, fallback }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const live = useRef({ visible, selected, onSelect, clusterLabel, nameOf });
  live.current = { visible, selected, onSelect, clusterLabel, nameOf };
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 10.5);
    const world = new Group();
    scene.add(world);

    const color = (id: ClusterId) => new Color(clusters.find((c) => c.id === id)?.color ?? "#ffffff");
    const nodes = layout(projects);
    const meshes = new Map<string, Mesh>();
    const disposables: { dispose(): void }[] = [];
    const sphere = new SphereGeometry(1, 20, 14);
    disposables.push(sphere);

    for (const n of nodes) {
      const priv = n.visibility === "private";
      const mat = new MeshBasicMaterial({ color: color(n.cluster), transparent: true, wireframe: priv });
      disposables.push(mat);
      const m = new Mesh(sphere, mat);
      m.scale.setScalar(priv ? 0.17 : 0.14);
      m.position.set(n.x, n.y, n.z);
      m.userData = { id: n.id, base: priv ? 0.17 : 0.14 };
      world.add(m);
      meshes.set(n.id, m);
    }
    const hubMeshes = (Object.keys(HUBS) as ClusterId[]).map((id) => {
      const mat = new MeshBasicMaterial({ color: color(id) });
      disposables.push(mat);
      const m = new Mesh(sphere, mat);
      m.scale.setScalar(0.3);
      m.position.set(...HUBS[id]);
      world.add(m);
      return { id, m };
    });
    const centerMat = new MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    disposables.push(centerMat);
    const centerGeo = new SphereGeometry(1, 12, 8);
    disposables.push(centerGeo);
    const center = new Mesh(centerGeo, centerMat);
    center.scale.setScalar(0.45);
    world.add(center);

    // edges: centre to hub, hub to node
    const pairs: [Mesh, Mesh][] = [];
    hubMeshes.forEach(({ m }) => pairs.push([center, m]));
    for (const n of nodes) {
      const hub = hubMeshes.find((h) => h.id === n.cluster)!.m;
      pairs.push([hub, meshes.get(n.id)!]);
    }
    const linePos = new Float32Array(pairs.length * 6);
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute("position", new BufferAttribute(linePos, 3));
    const lineMat = new LineBasicMaterial({ transparent: true, opacity: 0.55 });
    disposables.push(lineGeo, lineMat);
    const lines = new LineSegments(lineGeo, lineMat);
    world.add(lines);
    const paintLines = () => lineMat.color.set(getComputedStyle(document.documentElement).getPropertyValue("--edge").trim() || "#2f6b3f");
    paintLines();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", paintLines);

    // data pulses
    const pulseMat = new MeshBasicMaterial({ color: 0xffffff });
    disposables.push(pulseMat);
    const pulses = hubMeshes.map((h, i) => {
      const p = new Mesh(sphere, pulseMat);
      p.scale.setScalar(0.06);
      world.add(p);
      return { p, h: h.m, offset: i * 0.25 };
    });

    // labels (hubs) and tooltip as DOM overlays
    const labelLayer = document.createElement("div");
    labelLayer.className = "g3d-labels";
    host.appendChild(labelLayer);
    const labels = hubMeshes.map(({ id }) => {
      const el = document.createElement("span");
      el.className = "g3d-label";
      el.style.color = `#${color(id).getHexString()}`;
      labelLayer.appendChild(el);
      return { id, el };
    });
    const tip = document.createElement("div");
    tip.className = "g3d-tip";
    tip.hidden = true;
    labelLayer.appendChild(tip);

    const size = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.position.z = Math.max(10.5, 11.6 / camera.aspect);
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);

    // interaction
    const ray = new Raycaster();
    const ptr = new Vector2();
    const setPtr = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
    };
    const hit = () => ray.intersectObjects([...meshes.values()], false)[0]?.object as Mesh | undefined;
    let drag: { id: string; plane: Plane; moved: number } | null = null;
    let rotate: { x: number; y: number; moved: number } | null = null;
    let idleSince = performance.now();
    const down = (e: PointerEvent) => {
      idleSince = performance.now();
      setPtr(e);
      renderer.domElement.setPointerCapture(e.pointerId);
      const h = hit();
      if (h) {
        const wp = h.getWorldPosition(new Vector3());
        const n = camera.getWorldDirection(new Vector3());
        drag = { id: h.userData.id as string, plane: new Plane().setFromNormalAndCoplanarPoint(n, wp), moved: 0 };
      } else {
        rotate = { x: e.clientX, y: e.clientY, moved: 0 };
      }
    };
    const move = (e: PointerEvent) => {
      idleSince = performance.now();
      setPtr(e);
      if (drag) {
        const target = new Vector3();
        if (ray.ray.intersectPlane(drag.plane, target)) {
          meshes.get(drag.id)!.position.copy(world.worldToLocal(target));
          drag.moved += 1;
        }
      } else if (rotate) {
        const dx = e.clientX - rotate.x, dy = e.clientY - rotate.y;
        rotate.x = e.clientX; rotate.y = e.clientY; rotate.moved += Math.abs(dx) + Math.abs(dy);
        world.rotation.y += dx * 0.006;
        world.rotation.x = Math.max(-1.1, Math.min(1.1, world.rotation.x + dy * 0.006));
      } else {
        const h = hit();
        renderer.domElement.style.cursor = h ? "pointer" : "grab";
        if (h) {
          const r = host.getBoundingClientRect();
          tip.hidden = false;
          tip.textContent = live.current.nameOf(h.userData.id as string);
          tip.style.transform = `translate(${e.clientX - r.left + 12}px, ${e.clientY - r.top + 12}px)`;
        } else tip.hidden = true;
      }
    };
    const up = () => {
      if (drag && drag.moved < 3) live.current.onSelect(drag.id);
      else if (rotate && rotate.moved < 4) live.current.onSelect(null);
      drag = null; rotate = null;
    };
    const leave = () => { tip.hidden = true; };
    const el = renderer.domElement;
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", leave);

    const v = new Vector3();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const motion = !reducedMotion();
      if (motion && !drag && !rotate && now - idleSince > 2500) world.rotation.y += 0.0016;
      const { visible: vis, selected: sel } = live.current;
      for (const [id, m] of meshes) {
        const on = vis.has(id);
        (m.material as MeshBasicMaterial).opacity = on ? 1 : 0.12;
        m.scale.setScalar((m.userData.base as number) * (id === sel ? 1.7 : 1));
      }
      pairs.forEach(([a, b], i) => {
        linePos.set([a.position.x, a.position.y, a.position.z, b.position.x, b.position.y, b.position.z], i * 6);
      });
      lineGeo.attributes.position.needsUpdate = true;
      for (const { p, h, offset } of pulses) {
        p.visible = motion;
        const s = ((now / 3400 + offset) % 1);
        p.position.lerpVectors(center.position, h.position, s);
      }
      for (const { id, el: l } of labels) {
        const hub = hubMeshes.find((x) => x.id === id)!.m;
        hub.getWorldPosition(v).project(camera);
        const r = host.getBoundingClientRect();
        l.textContent = live.current.clusterLabel(id);
        const px = ((v.x + 1) / 2) * r.width;
        const left = v.x > 0.35;
        l.style.transform = `translate(${left ? px - 20 : px + 20}px, ${((1 - v.y) / 2) * r.height - 8}px)${left ? " translateX(-100%)" : ""}`;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener("change", paintLines);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointerleave", leave);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      host.replaceChildren();
    };
  }, [projects, clusters]);

  return (
    <div className="g3d" ref={mount} role="presentation">
      {failed && <p className="muted">{fallback}</p>}
    </div>
  );
}
