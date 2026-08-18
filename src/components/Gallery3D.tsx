import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { InputManager } from "@/lib/input/InputManager";

interface Artwork {
  title: string;
  author: string;
  color: number;
  position: [number, number, number];
  rotationY: number;
}

const ARTWORKS: Artwork[] = [
  { title: "Orizzonte Liquido", author: "M. Reni", color: 0xd97a4a, position: [-7.9, 2, -4], rotationY: Math.PI / 2 },
  { title: "Campo Magnetico", author: "A. Vella", color: 0x3f7f8f, position: [-7.9, 2, 4], rotationY: Math.PI / 2 },
  { title: "Silenzio Verticale", author: "L. Ferri", color: 0xb8a05a, position: [7.9, 2, -4], rotationY: -Math.PI / 2 },
  { title: "Onda Ferma", author: "S. Toma", color: 0x7a5a8f, position: [7.9, 2, 4], rotationY: -Math.PI / 2 },
  { title: "Terra Rossa", author: "G. Salvi", color: 0xa64b3c, position: [-3, 2, -11.9], rotationY: 0 },
  { title: "Luce Obliqua", author: "C. Marra", color: 0x4c7a55, position: [3, 2, -11.9], rotationY: 0 },
];

export function Gallery3D({
  manager,
  onFocus,
}: {
  manager: InputManager | null;
  onFocus: (a: { title: string; author: string } | null) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<Artwork | null>(null);
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !manager) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101014);
    scene.fog = new THREE.Fog(0x101014, 12, 34);

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.set(0, 1.7, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.xr.enabled = true;
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

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x24242c, roughness: 1 });
    const walls: Array<[number, number, number, number]> = [
      [-8, 0, 0, Math.PI / 2],
      [8, 0, 0, -Math.PI / 2],
      [0, 0, -12, 0],
      [0, 0, 12, Math.PI],
    ];
    walls.forEach(([x, , z, ry]) => {
      const geo = new THREE.PlaneGeometry(ry === 0 || Math.abs(ry) === Math.PI ? 16 : 24, 6);
      const wall = new THREE.Mesh(geo, wallMat);
      wall.position.set(x, 3, z);
      wall.rotation.y = ry;
      scene.add(wall);
    });

    const frames: Array<{ mesh: THREE.Mesh; data: Artwork }> = [];
    ARTWORKS.forEach((a) => {
      const group = new THREE.Group();
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 2.2, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x0d0d10 }),
      );
      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(2.9, 1.9),
        new THREE.MeshStandardMaterial({ color: a.color, roughness: 0.6 }),
      );
      canvas.position.z = 0.08;
      group.add(frame, canvas);
      group.position.set(...a.position);
      group.rotation.y = a.rotationY;
      scene.add(group);
      frames.push({ mesh: frame, data: a });

      const spot = new THREE.PointLight(0xfff0d0, 12, 8);
      spot.position.set(a.position[0] * 0.82, 4, a.position[2]);
      scene.add(spot);
    });

    // WebXR controllers take priority during an immersive session.
    const onXrStart = () => manager.setXrActive(true);
    const onXrEnd = () => manager.setXrActive(false);
    renderer.xr.addEventListener("sessionstart", onXrStart);
    renderer.xr.addEventListener("sessionend", onXrEnd);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onCanvasClick = () => {
      if (!("ontouchstart" in window)) renderer.domElement.requestPointerLock?.();
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    let yaw = 0;
    let pitch = 0;
    const clock = new THREE.Clock();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();

    // PlayerController: consumes only abstract input, never device specifics.
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const input = manager.sample();

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
      const found = hit && hit.distance < 6 ? frames.find((f) => f.mesh === hit.object)!.data : null;
      if (found !== focusRef.current) {
        focusRef.current = found ?? null;
        onFocusRef.current(found ? { title: found.title, author: found.author } : null);
      }

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.xr.removeEventListener("sessionstart", onXrStart);
      renderer.xr.removeEventListener("sessionend", onXrEnd);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [manager]);

  return <div ref={mountRef} className="absolute inset-0" />;
}

export default Gallery3D;
