"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { fogFragment, fogVertex } from "./shaders";

/** Volumetric-ish fog plane + mouse-reactive wave grid */
export default function FogGrid() {
  const fogMat = useRef<THREE.ShaderMaterial>(null);
  const grid = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uFogA: { value: new THREE.Vector3(0.05, 0.04, 0.12) },
      uFogB: { value: new THREE.Vector3(0.35, 0.08, 0.22) },
    }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (fogMat.current) {
      fogMat.current.uniforms.uTime.value = t;
      const m = fogMat.current.uniforms.uMouse.value as THREE.Vector2;
      m.x += (mouse.current.x - m.x) * 0.06;
      m.y += (mouse.current.y - m.y) * 0.06;
    }
    if (grid.current) {
      const pos = grid.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        arr[i + 2] =
          Math.sin(x * 0.8 + t * 1.2 + mouse.current.x) * 0.15 +
          Math.cos(y * 0.7 + t * 0.9 + mouse.current.y) * 0.12;
      }
      pos.needsUpdate = true;
      grid.current.rotation.x = -Math.PI / 2.6;
    }
    void dt;
  });

  return (
    <group>
      <mesh
        position={[0, 0, -6]}
        scale={[viewport.width * 1.4, viewport.height * 1.4, 1]}
        onPointerMove={(e) => {
          mouse.current.x = e.uv?.x ? e.uv.x * 2 - 1 : 0;
          mouse.current.y = e.uv?.y ? e.uv.y * 2 - 1 : 0;
        }}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={fogMat}
          vertexShader={fogVertex}
          fragmentShader={fogFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh ref={grid} position={[0, -1.8, -2]}>
        <planeGeometry args={[14, 14, 48, 48]} />
        <meshBasicMaterial
          color="#6366f1"
          wireframe
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
