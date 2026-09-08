"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

function shouldSkip(path: string | null): boolean {
  if (!path) return false;
  return (
    path.startsWith("/code") ||
    path.startsWith("/tin-nhan") ||
    path.startsWith("/bao-tri") ||
    path.startsWith("/admin")
  );
}

export default function GsapScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const skip = shouldSkip(pathname);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    let tickerFn: ((time: number) => void) | null = null;

    if (!skip && !reduced) {
      document.documentElement.classList.add("lenis", "lenis-smooth");
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.2,
        autoRaf: false,
      });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);

      tickerFn = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-gsap-reveal]").forEach((el, i) => {
        const delay = Number(el.dataset.gsapDelay || 0) + (i % 5) * 0.03;
        gsap.fromTo(
          el,
          { y: 40, opacity: 0, filter: "blur(4px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.8,
            delay,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
              once: true,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.speed || "1");
        if (!speed || speed === 1) return;
        gsap.fromTo(
          el,
          { y: (1 - speed) * -80 },
          {
            y: (1 - speed) * 80,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement || el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.65,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-lag]").forEach((el) => {
        const lag = parseFloat(el.dataset.lag || "0");
        if (!lag) return;
        gsap.fromTo(
          el,
          { y: 24 },
          {
            y: -24,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: lag,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-gsap-row]").forEach((row) => {
        const kids = row.querySelectorAll("[data-gsap-card], a, [data-movie-card]");
        if (!kids.length) return;
        gsap.fromTo(
          kids,
          { y: 24, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.045,
            ease: "power2.out",
            scrollTrigger: {
              trigger: row,
              start: "top 88%",
              toggleActions: "play none none none",
              once: true,
            },
          }
        );
      });
    });

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      if (tickerFn) gsap.ticker.remove(tickerFn);
      lenis?.destroy();
      lenisRef.current = null;
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [pathname]);

  return <>{children}</>;
}
