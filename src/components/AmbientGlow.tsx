"use client";
import type { ReactNode } from "react";

/** Tắt ambient glow — children only */
export default function AmbientGlow({
  children,
}: {
  children?: ReactNode;
  src?: string | null;
  className?: string;
}) {
  return <>{children}</>;
}
