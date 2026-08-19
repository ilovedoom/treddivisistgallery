import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { InputManager } from "@/lib/input/InputManager";
import type { Artwork, GalleryConfig, LangCode } from "@/lib/gallery/types";
import { resolveFlag } from "@/lib/gallery/resolve";
import { buildPlaqueLines } from "@/lib/gallery/plaqueText";
import { createPlaqueTexture } from "@/lib/gallery/plaqueTexture";

const ART_HEIGHT = 1.9;

function artworkSize(a: Artwork): { w: number; h: number } {
  const ratio = a.media.width && a.media.height ? a.media.width / a.media.height : 1.5;
  return { w: THREE.MathUtils.clamp(ART_HEIGHT * ratio, 0.8, 3.4), h: ART_HEIGHT };
}

export function Gallery3D({
  manager,
  config,
  lang,
  onFocus,
  focusArtworkId,
  viewingDistance = 2.6,
}: {
  manager: InputManager | null;
  config: GalleryConfig;
  lang: LangCode;
  onFocus?: (id: string | null) => void;
  /** Modalità anteprima: camera fissa davanti a un'opera, nessun movimento. */
  focusArtworkId?: string;
  viewingDistance?: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<string | null>(null);
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  useEffect(() => {
    const mount = mountRef.current;
    const preview = Boolean(focusArtworkId);
    if (!mount || (!manager && !preview)) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101014);
    scene.fog = new THREE.Fog(0x101014, 12, 34);

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.set(0, 1.7, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = !preview;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x30303a, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 8, 6);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 24),
      new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const disposables: Array<{ dispose: () => void }> = [];
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x24242c, roughness: 1 });
    disposables.push(wallMat);

    const frames: Array<{ mesh: THREE.Mesh; id: string }> = [];
    const wallGroups = new Map<string, THREE.Group>();

    // Ogni parete è un gruppo: opere, targhette e luci restano solidali alla parete.
    config.walls.forEach((wall) => {
      const group = new THREE.Group();
      group.position.set(wall.x, 0, wall.z);
      group.rotation.y = wall.rotationY;
      const geo = new THREE.PlaneGeometry(wall.width, wall.height);
      disposables.push(geo);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(0, wall.height / 2, 0);
      group.add(mesh);
      scene.add(group);
      wallGroups.set(wall.id, group);
    });

    // Pareti di chiusura (nessuna opera associata).
    const frontGeo = new THREE.PlaneGeometry(16, 6);
    disposables.push(frontGeo);
    const front = new THREE.Mesh(frontGeo, wallMat);
    front.position.set(0, 3, 12);
    front.rotation.y = Math.PI;
    scene.add(front);

    config.artworks.forEach((a) => {
      const parent = wallGroups.get(a.wallId);
      if (!parent) return;
      const { w, h } = artworkSize(a);

      const group = new THREE.Group();
      group.position.set(a.u, a.v, 0.06);
      parent.add(group);

      const frameGeo = new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.12);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0d0d10 });
      const canvasGeo = new THREE.PlaneGeometry(w, h);
      const canvasMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(a.media.color),
        roughness: 0.6,
      });
      disposables.push(frameGeo, frameMat, canvasGeo, canvasMat);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
      canvasMesh.position.z = 0.08;
      group.add(frame, canvasMesh);
      frames.push({ mesh: frame, id: a.id });

      const spot = new THREE.PointLight(0xfff0d0, 10, 8);
      spot.position.set(a.u, a.v + 2, 1.6);
      parent.add(spot);

      if (resolveFlag(config, a, "showPlaque")) {
        const lines = buildPlaqueLines(config, a, lang, config.defaultLanguage);
        if (lines.length) {
          const pw = a.plaque.width;
          const ph = a.plaque.height;
          const texture = createPlaqueTexture(
            lines,
            config.plaqueStyle,
            pw,
            ph,
            a.plaque.alignment,
            a.plaque.textSize,
          );
          const plaqueGeo = new THREE.PlaneGeometry(pw, ph);
          const plaqueMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: config.plaqueStyle.opacity < 1,
            opacity: config.plaqueStyle.opacity,
          });
          disposables.push(plaqueGeo, plaqueMat, texture);
          const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);

          let px = 0;
          let py = 0;
          switch (a.plaque.position) {
            case "LEFT":
              px = -(w / 2 + 0.2 + pw / 2);
              break;
            case "RIGHT":
              px = w / 2 + 0.2 + pw / 2;
              break;
            case "CUSTOM":
              break;
            default:
              py = -(h / 2 + 0.22 + ph / 2);
          }
          plaque.position.set(
            px + a.plaque.offset.x,
            py + a.plaque.offset.y,
            0.1 + a.plaque.offset.z,
          );
          plaque.rotation.z = (a.plaque.rotation * Math.PI) / 180;
          // Figlia del gruppo opera: segue opera e parete mantenendo la posizione relativa.
          group.add(plaque);
        }
      }
    });

    const onXrStart = () => manager?.setXrActive(true);
    const onXrEnd = () => manager?.setXrActive(false);
    if (!preview) {
      renderer.xr.addEventListener("sessionstart", onXrStart);
      renderer.xr.addEventListener("sessionend", onXrEnd);
    }

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(Math.max(w, 1), Math.max(h, 1));
      camera.aspect = Math.max(w, 1) / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onCanvasClick = () => {
      if (!preview && !("ontouchstart" in window)) renderer.domElement.requestPointerLock?.();
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    if (preview) {
      const target = config.artworks.find((a) => a.id === focusArtworkId) ?? config.artworks[0];
      const wall = target ? config.walls.find((w) => w.id === target.wallId) : undefined;
      if (target && wall) {
        const dirX = Math.cos(wall.rotationY);
        const dirZ = -Math.sin(wall.rotationY);
        const normX = Math.sin(wall.rotationY);
        const normZ = Math.cos(wall.rotationY);
        const ax = wall.x + dirX * target.u;
        const az = wall.z + dirZ * target.u;
        camera.position.set(ax + normX * viewingDistance, target.v - 0.15, az + normZ * viewingDistance);
        camera.lookAt(ax, target.v - 0.15, az);
      }
      renderer.render(scene, camera);
      const onResizeRender = () => {
        resize();
        renderer.render(scene, camera);
      };
      const ro2 = new ResizeObserver(onResizeRender);
      ro2.observe(mount);
      return () => {
        ro2.disconnect();
        ro.disconnect();
        renderer.domElement.removeEventListener("click", onCanvasClick);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    }

    let yaw = 0;
    let pitch = 0;
    const clock = new THREE.Clock();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const input = manager!.sample();

      yaw -= input.look.x * dt * 0.35;
      pitch = Math.max(-1.2, Math.min(1.2, pitch - input.look.y * dt * 0.35));
      camera.rotation.set(pitch, yaw, 0, "YXZ");

      forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      right.set(Math.cos(yaw), 0, -Math.sin(yaw));
      const speed = (input.held.ACTION_SECONDARY ? 6 : 3) * dt;
      camera.position.addScaledVector(forward, input.move.y * speed);
      camera.position.addScaledVector(right, input.move.x * speed);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7.2, 7.2);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -11.2, 11.2);
      camera.position.y = 1.7;

      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hit = raycaster.intersectObjects(frames.map((f) => f.mesh))[0];
      const found = hit && hit.distance < 6 ? frames.find((f) => f.mesh === hit.object)!.id : null;
      if (found !== focusRef.current) {
        focusRef.current = found ?? null;
        onFocusRef.current?.(found);
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.xr.removeEventListener("sessionstart", onXrStart);
      renderer.xr.removeEventListener("sessionend", onXrEnd);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      ro.disconnect();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [manager, config, lang, focusArtworkId, viewingDistance]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

export default Gallery3D;
