"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { coreFragment, coreVertex } from "./shaders";
import { CATEGORY_VISUALS, type OpusCategory } from "./types";

function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

/** Central morphing portal sphere — category-driven shaders */
export default function OpusCore({ category }: { category: OpusCategory }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const target = CATEGORY_VISUALS[category];
  const current = useRef({ ...target });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseAmp: { value: target.noiseAmp },
      uPulse: { value: target.pulse },
      uWire: { value: target.wireframe },
      uBloom: { value: target.bloom },
      uColorA: { value: hexToVec3(target.primary) },
      uColorB: { value: hexToVec3(target.secondary) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, dt) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value += dt;
    const lerp = 1 - Math.exp(-dt * 3.2);
    const c = current.current;
    c.noiseAmp += (target.noiseAmp - c.noiseAmp) * lerp;
    c.pulse += (target.pulse - c.pulse) * lerp;
    c.wireframe += (target.wireframe - c.wireframe) * lerp;
    c.bloom += (target.bloom - c.bloom) * lerp;
    m.uniforms.uNoiseAmp.value = c.noiseAmp;
    m.uniforms.uPulse.value = c.pulse;
    m.uniforms.uWire.value = c.wireframe;
    m.uniforms.uBloom.value = c.bloom;
    const a = hexToVec3(target.primary);
    const b = hexToVec3(target.secondary);
    (m.uniforms.uColorA.value as THREE.Vector3).lerp(a, lerp);
    (m.uniforms.uColorB.value as THREE.Vector3).lerp(b, lerp);
    if (mesh.current) {
      mesh.current.rotation.y += dt * 0.15;
      mesh.current.rotation.x = Math.sin(m.uniforms.uTime.value * 0.4) * 0.12;
    }
  });

  return (
    <mesh ref={mesh} scale={1.35}>
      <icosahedronGeometry args={[1, 48]} />
      <shaderMaterial
        ref={mat}
        vertexShader={coreVertex}
        fragmentShader={coreFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
