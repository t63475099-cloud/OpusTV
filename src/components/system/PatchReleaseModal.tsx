"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangelogGroups } from "@/lib/deploy/types";

interface ReleasePayload {
  kind: "SYSTEM_RELEASE_PUBLISHED";
  deploymentId: string;
  versionTag: string;
  title: string;
  markdown: string;
  changelog: ChangelogGroups;
  vercelUrl: string;
  gitCommitSha: string;
  at: string;
}

const SEEN_KEY = "opus_last_release_id";

export function PatchReleaseModal() {
  const [release, setRelease] = useState<ReleasePayload | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((p: ReleasePayload) => {
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      if (seen === p.deploymentId) return;
    } catch {
      /* */
    }
    setRelease(p);
    setOpen(true);
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let retry = 0;

    const connect = () => {
      if (closed) return;
      try {
        es = new EventSource("/api/system/release-sse");
        es.addEventListener("SYSTEM_RELEASE_PUBLISHED", (ev) => {
          try {
            const data = JSON.parse((ev as MessageEvent).data) as ReleasePayload;
            show(data);
          } catch {
            /* */
          }
        });
        es.onerror = () => {
          es?.close();
          retry = Math.min(retry + 1, 6);
          setTimeout(connect, 1000 * Math.pow(1.5, retry));
        };
        es.onopen = () => {
          retry = 0;
        };
      } catch {
        setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      closed = true;
      es?.close();
    };
  }, [show]);

  const apply = async () => {
    if (release) {
      try {
        localStorage.setItem(SEEN_KEY, release.deploymentId);
        localStorage.setItem(
          "opus_client_build_id",
          release.gitCommitSha || release.deploymentId
        );
      } catch {
        /* */
      }
    }
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* */
    }
    setOpen(false);
    window.location.reload();
  };

  if (!open || !release) return null;

  const c = release.changelog || {
    features: [],
    performance: [],
    fixes: [],
    security: [],
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-600/80 bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-100 shadow-2xl shadow-violet-900/20">
        <div className="border-b border-zinc-700/80 bg-zinc-900/80 px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-violet-400">
            Cập nhật hệ thống · {release.versionTag}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{release.title}</h2>
        </div>
        <div className="max-h-[50vh] space-y-4 overflow-y-auto px-5 py-4 text-sm">
          {c.features.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-medium text-emerald-400">
                🚀 Tính năng mới & Nâng cấp
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                {c.features.map((x, i) => (
                  <li key={`f-${i}`}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {c.performance.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-medium text-sky-400">⚡ Tối ưu hiệu năng</h3>
              <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                {c.performance.map((x, i) => (
                  <li key={`p-${i}`}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {c.fixes.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-medium text-amber-400">
                🛠️ Sửa lỗi & Ổn định
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                {c.fixes.map((x, i) => (
                  <li key={`x-${i}`}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {c.security.length > 0 && (
            <section>
              <h3 className="mb-1.5 font-medium text-rose-400">
                🛡️ Bảo mật & Hạ tầng
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                {c.security.map((x, i) => (
                  <li key={`s-${i}`}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {!c.features.length &&
            !c.performance.length &&
            !c.fixes.length &&
            !c.security.length &&
            release.markdown && (
              <pre className="whitespace-pre-wrap text-xs text-zinc-400">
                {release.markdown}
              </pre>
            )}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-3">
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm"
            onClick={() => {
              try {
                if (release) localStorage.setItem(SEEN_KEY, release.deploymentId);
              } catch {
                /* */
              }
              setOpen(false);
            }}
          >
            Để sau
          </button>
          <button
            type="button"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white"
            onClick={() => void apply()}
          >
            Áp dụng & Trải nghiệm ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatchReleaseModal;
