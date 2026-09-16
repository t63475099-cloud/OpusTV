"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  onScrollSpeed?: (speed: number) => void;
  onProgress?: (p: number) => void;
};

/**
 * Camera fly-through bound to page scroll — lerp damping for inertia.
 * Hook: call from inside Canvas; targets document scroll.
 */
export default function ScrollCamera({ onScrollSpeed, onProgress }: Props) {
  const { camera } = useThree();
  const target = useRef({ z: 5, y: 0.2, x: 0, rotX: 0, rotY: 0 });
  const current = useRef({ z: 5, y: 0.2, x: 0, rotX: 0, rotY: 0 });
  const lastP = useRef(0);
  const speed = useRef(0);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        speed.current = Math.min(1, Math.abs(p - lastP.current) * 40);
        lastP.current = p;
        onScrollSpeed?.(speed.current);
        onProgress?.(p);
        // choreography keyframes
        target.current.z = 5 - p * 2.8;
        target.current.y = 0.2 + Math.sin(p * Math.PI) * 0.6;
        target.current.x = Math.sin(p * Math.PI * 2) * 0.35;
        target.current.rotX = p * 0.15;
        target.current.rotY = Math.sin(p * Math.PI) * 0.12;
      },
    });
    return () => {
      st.kill();
    };
  }, [onProgress, onScrollSpeed]);

  useFrame((_, dt) => {
    const damp = 1 - Math.exp(-dt * 4.5);
    const c = current.current;
    const t = target.current;
    c.z += (t.z - c.z) * damp;
    c.y += (t.y - c.y) * damp;
    c.x += (t.x - c.x) * damp;
    c.rotX += (t.rotX - c.rotX) * damp;
    c.rotY += (t.rotY - c.rotY) * damp;
    camera.position.set(c.x, c.y, c.z);
    camera.rotation.set(c.rotX, c.rotY, 0);
    // decay warp intensity
    speed.current *= 0.96;
  });

  return null;
}
