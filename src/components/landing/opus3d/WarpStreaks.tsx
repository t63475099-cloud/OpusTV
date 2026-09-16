"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Warp-drive light streaks — intensity driven by scroll speed */
export default function WarpStreaks({ intensity = 0 }: { intensity?: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 400;

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = -Math.random() * 20;
      speeds[i] = 4 + Math.random() * 12;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const boost = 1 + intensity * 8;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += speeds[i] * dt * boost;
      if (arr[i * 3 + 2] > 4) {
        arr[i * 3] = (Math.random() - 0.5) * 12;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
        arr[i * 3 + 2] = -18 - Math.random() * 6;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = Math.min(0.85, 0.15 + intensity * 0.7);
    mat.size = 0.04 + intensity * 0.12;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#f8fafc"
        size={0.05}
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
