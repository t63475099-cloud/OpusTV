"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Gamepad2,
} from "lucide-react";
import { useCodeStore } from "@/lib/codeStore";
import {
  dispatchArrowKey,
  runPythonWithSkulpt,
  usesTurtle,
} from "@/lib/skulptRunner";
import { cn } from "@/lib/utils";

const TURTLE_TARGET_ID = "opus-turtle-canvas";

export default function CanvasPreview() {
  const canvasVisible = useCodeStore((s) => s.canvasVisible);
  const turtleCode = useCodeStore((s) => s.turtleCode);
  const setTurtleCode = useCodeStore((s) => s.setTurtleCode);
  const setRunning = useCodeStore((s) => s.setRunning);
  const addTermLine = useCodeStore((s) => s.addTermLine);
  const setCanvasVisible = useCodeStore((s) => s.setCanvasVisible);
  const [ready, setReady] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!canvasVisible) {
      setReady(false);
      return;
    }
    // Đợi layout xong để canvas có kích thước
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [canvasVisible]);

  useEffect(() => {
    if (!ready || !turtleCode || runningRef.current) return;
    let cancelled = false;
    runningRef.current = true;
    setRunning(true);

    (async () => {
      addTermLine({
        kind: "info",
        text: usesTurtle(turtleCode)
          ? "Skulpt · Python Turtle — Canvas Preview"
          : "Skulpt · Python",
      });
      const result = await runPythonWithSkulpt({
        code: turtleCode,
        turtleTargetId: TURTLE_TARGET_ID,
        onOutput: (text) => {
          if (cancelled) return;
          for (const row of text.split("\n")) {
            if (row.length) addTermLine({ kind: "out", text: row });
          }
        },
        onError: (text) => {
          if (!cancelled) addTermLine({ kind: "err", text });
        },
      });
      if (!cancelled) {
        addTermLine({
          kind: "info",
          text: result.ok
            ? `Turtle/Python xong · ${result.durationMs} ms`
            : `Lỗi · ${result.durationMs} ms`,
        });
        setTurtleCode(null);
        setRunning(false);
        runningRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      runningRef.current = false;
    };
  }, [ready, turtleCode, addTermLine, setRunning, setTurtleCode]);

  if (!canvasVisible) return null;

  const padBtn =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white active:scale-95 active:bg-rose-500/40 touch-manipulation select-none transition-transform duration-150";

  const hold = (dir: "up" | "down" | "left" | "right") => {
    dispatchArrowKey(dir, "down");
  };
  const release = (dir: "up" | "down" | "left" | "right") => {
    dispatchArrowKey(dir, "up");
  };

  return (
    <div className="flex min-h-[160px] flex-1 flex-col border-t border-[#2b2b2b] md:border-l md:border-t-0 bg-[#0a0a0a]">
      <div className="flex items-center gap-2 bg-[#1e1e1e] px-2 py-1">
        <Gamepad2 className="h-3.5 w-3.5 text-rose-400" />
        <span className="text-[10px] uppercase tracking-wide text-zinc-400">
          Canvas / Game Preview
        </span>
        <button
          type="button"
          className="ml-auto rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-white/10 hover:text-white"
          onClick={() => {
            setCanvasVisible(false);
            setTurtleCode(null);
            const el = document.getElementById(TURTLE_TARGET_ID);
            if (el) el.innerHTML = "";
          }}
        >
          Đóng
        </button>
      </div>

      <div
        id={TURTLE_TARGET_ID}
        className="relative mx-auto min-h-[180px] w-full flex-1 overflow-hidden bg-[#0a0a0a]"
        style={{ maxHeight: "min(42vh, 360px)" }}
      />

      {/* D-pad ảo — mobile / cảm ứng */}
      <div className="flex flex-col items-center gap-1 border-t border-[#2b2b2b] bg-[#121212] px-3 py-2">
        <p className="text-[10px] text-zinc-500 mb-0.5">
          Điều khiển · phím mũi tên / D-pad
        </p>
        <button
          type="button"
          className={padBtn}
          aria-label="Lên"
          onPointerDown={(e) => {
            e.preventDefault();
            hold("up");
          }}
          onPointerUp={() => release("up")}
          onPointerLeave={() => release("up")}
          onPointerCancel={() => release("up")}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={padBtn}
            aria-label="Trái"
            onPointerDown={(e) => {
              e.preventDefault();
              hold("left");
            }}
            onPointerUp={() => release("left")}
            onPointerLeave={() => release("left")}
            onPointerCancel={() => release("left")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={cn(padBtn, "opacity-40 pointer-events-none")}
            tabIndex={-1}
            aria-hidden
          >
            <span className="h-2 w-2 rounded-full bg-white/30" />
          </button>
          <button
            type="button"
            className={padBtn}
            aria-label="Phải"
            onPointerDown={(e) => {
              e.preventDefault();
              hold("right");
            }}
            onPointerUp={() => release("right")}
            onPointerLeave={() => release("right")}
            onPointerCancel={() => release("right")}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          className={padBtn}
          aria-label="Xuống"
          onPointerDown={(e) => {
            e.preventDefault();
            hold("down");
          }}
          onPointerUp={() => release("down")}
          onPointerLeave={() => release("down")}
          onPointerCancel={() => release("down")}
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
