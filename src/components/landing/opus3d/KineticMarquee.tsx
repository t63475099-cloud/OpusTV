"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const PHRASES = ["OPUSTV", "CINEMA", "BEATS", "TERMINAL", "OPUS CHAT", "LIVE"];

/**
 * Infinite mid-ground typography — renderOrder so it sits between fog and core.
 */
export default function KineticMarquee() {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      PHRASES.map((text, i) => ({
        text,
        x: i * 4.2 - 8,
        y: ((i % 3) - 1) * 1.1,
        speed: 0.35 + (i % 3) * 0.12,
      })),
    []
  );

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const meta = items[i];
      child.position.x += meta.speed * dt;
      if (child.position.x > 12) child.position.x = -12;
    });
  });

  return (
    <group ref={group} position={[0, 0.3, -1.2]} renderOrder={1}>
      {items.map((it) => (
        <Text
          key={it.text + it.x}
          position={[it.x, it.y, 0]}
          fontSize={0.55}
          color="#ffffff"
          fillOpacity={0.14}
          anchorX="center"
          anchorY="middle"
          depthOffset={-2}
        >
          {it.text}
        </Text>
      ))}
    </group>
  );
}
