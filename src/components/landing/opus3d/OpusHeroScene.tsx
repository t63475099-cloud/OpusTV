"use client";

import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import OpusCore from "./OpusCore";
import FogGrid from "./FogGrid";
import WarpStreaks from "./WarpStreaks";
import KineticMarquee from "./KineticMarquee";
import ScrollCamera from "./ScrollCamera";
import type { OpusCategory } from "./types";

type Props = {
  category?: OpusCategory;
  className?: string;
  interactiveOrbit?: boolean;
};

/**
 * Main WebGL entry — mount once on landing hero / full-bleed background.
 * Integration: <OpusHeroScene category={activeCategory} />
 */
export default function OpusHeroScene({
  category = "idle",
  className,
  interactiveOrbit = false,
}: Props) {
  const [warp, setWarp] = useState(0);

  const onScrollSpeed = useCallback((s: number) => {
    setWarp(s);
  }, []);

  return (
    <div className={className ?? "absolute inset-0 -z-10"}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.2, 5], fov: 45, near: 0.1, far: 60 }}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#070709"]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 3, 4]} intensity={1.2} color="#f43f5e" />
        <pointLight position={[-4, -2, 2]} intensity={0.8} color="#6366f1" />
        <Suspense fallback={null}>
          <FogGrid />
          <KineticMarquee />
          <OpusCore category={category} />
          <WarpStreaks intensity={warp} />
          <ScrollCamera onScrollSpeed={onScrollSpeed} />
          {interactiveOrbit ? (
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.6} />
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
