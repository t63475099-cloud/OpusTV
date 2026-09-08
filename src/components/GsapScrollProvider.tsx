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
    path.startsWith("/admin") ||
    path.startsWith("/phim")
  );
}

function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 768px)").matches
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
    const mobile = isCoarsePointer();

    let lenis: Lenis | null = null;
    let tickerFn: ((time: number) => void) | null = null;

    // Lenis chỉ desktop — mobile dùng native scroll (mượt + tiết kiệm pin)
    if (!skip && !reduced && !mobile) {
      document.documentElement.classList.add("lenis", "lenis-smooth");
      lenis = new Lenis({
        duration: 0.95,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        touchMultiplier: 1,
        autoRaf: false,
        syncTouch: false,
      });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);

      tickerFn = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(500, 33);
    }

    const ctx = gsap.context(() => {
      if (reduced || skip) return;

      // Reveal: chỉ transform + opacity (không blur — nặng GPU)
      gsap.utils.toArray<HTMLElement>("[data-gsap-reveal]").forEach((el, i) => {
        const delay = Math.min(0.2, Number(el.dataset.gsapDelay || 0) + (i % 4) * 0.02);
        gsap.fromTo(
          el,
          { y: mobile ? 16 : 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: mobile ? 0.4 : 0.55,
            delay,
            ease: "power2.out",
            force3D: true,
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              toggleActions: "play none none none",
              once: true,
            },
          }
        );
      });

      // Parallax nhẹ — bỏ trên mobile
      if (!mobile) {
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          const speed = parseFloat(el.dataset.speed || "1");
          if (!speed || speed === 1) return;
          gsap.fromTo(
            el,
            { y: (1 - speed) * -40 },
            {
              y: (1 - speed) * 40,
              ease: "none",
              force3D: true,
              scrollTrigger: {
                trigger: el.parentElement || el,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
              },
            }
          );
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-gsap-row]").forEach((row) => {
        const kids = row.querySelectorAll("[data-gsap-card], a, [data-movie-card]");
        if (!kids.length) return;
        const list = mobile ? Array.from(kids).slice(0, 8) : Array.from(kids);
        gsap.fromTo(
          list,
          { y: mobile ? 12 : 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: mobile ? 0.35 : 0.45,
            stagger: mobile ? 0.03 : 0.04,
            ease: "power2.out",
            force3D: true,
            scrollTrigger: {
              trigger: row,
              start: "top 90%",
              toggleActions: "play none none none",
              once: true,
            },
          }
        );
      });
    });

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener("resize", onResize, { passive: true });
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 180);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(resizeTimer);
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
