import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function TerrainMesh({ url }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const next = scene.clone(true);
    const box = new THREE.Box3().setFromObject(next);
    const center = box.getCenter(new THREE.Vector3());
    next.position.sub(center);
    return next;
  }, [scene]);

  return <primitive object={clone} />;
}

function CameraRig({ flying }) {
  const t = useRef(0);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-42, 22, 38),
        new THREE.Vector3(-8, 14, 12),
        new THREE.Vector3(24, 18, -18),
        new THREE.Vector3(8, 28, -32),
        new THREE.Vector3(-42, 22, 38),
      ]),
    []
  );

  useFrame((state, delta) => {
    if (!flying) return;
    t.current = (t.current + delta * 0.035) % 1;
    const pos = curve.getPointAt(t.current);
    const look = curve.getPointAt((t.current + 0.03) % 1);
    state.camera.position.lerp(pos, 0.06);
    state.camera.lookAt(look);
  });

  return (
    <OrbitControls
      enabled={!flying}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2.12}
      minDistance={18}
      maxDistance={140}
    />
  );
}

export default function TerrainCanvas({ modelUrl, flying }) {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 42, 68], fov: 42, near: 0.1, far: 400 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ scene, gl }) => {
        gl.setClearColor("#07080A");
        scene.fog = new THREE.FogExp2("#07080A", 0.0075);
      }}
    >
      <color attach="background" args={["#07080A"]} />
      <ambientLight intensity={0.28} color="#c9b8a4" />
      <directionalLight
        position={[48, 72, 28]}
        intensity={2.4}
        color="#ffd4a0"
        castShadow
      />
      <directionalLight position={[-40, 20, -30]} intensity={0.35} color="#6a7a88" />
      <Environment preset="sunset" />
      <Suspense fallback={null}>
        <TerrainMesh key={modelUrl} url={modelUrl} />
      </Suspense>
      <CameraRig flying={flying} />
    </Canvas>
  );
}
