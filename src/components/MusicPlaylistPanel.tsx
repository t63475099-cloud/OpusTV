"use client";

import { useState } from "react";
import { ListMusic, Plus, Trash2 } from "lucide-react";
import { useMusicPlaylist } from "@/lib/musicPlaylist";

export default function MusicPlaylistPanel({
  current,
}: {
  current?: { id: string; title: string; channel?: string; thumb?: string; duration?: string } | null;
}) {
  const playlists = useMusicPlaylist((s) => s.playlists);
  const activeId = useMusicPlaylist((s) => s.activeId);
  const create = useMusicPlaylist((s) => s.create);
  const remove = useMusicPlaylist((s) => s.remove);
  const setActive = useMusicPlaylist((s) => s.setActive);
  const addTrack = useMusicPlaylist((s) => s.addTrack);
  const [name, setName] = useState("");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <ListMusic className="w-4 h-4 text-rose-400" />
        Playlist của bạn
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên playlist"
          className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-rose-500/50"
        />
        <button
          type="button"
          onClick={() => {
            if (!name.trim()) return;
            create(name.trim());
            setName("");
          }}
          className="px-3 py-2 rounded-xl bg-rose-600 text-white text-sm inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Tạo
        </button>
      </div>
      {current && activeId && (
        <button
          type="button"
          onClick={() => addTrack(activeId, current)}
          className="w-full text-xs py-2 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 transition"
        >
          + Thêm bài đang phát vào playlist đang chọn
        </button>
      )}
      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
        {playlists.map((pl) => (
          <li
            key={pl.id}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition cursor-pointer ${
              activeId === pl.id
                ? "border-rose-500/40 bg-rose-500/10"
                : "border-white/5 bg-black/20 hover:bg-white/5"
            }`}
            onClick={() => setActive(pl.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{pl.name}</p>
              <p className="text-[10px] text-zinc-500">{pl.tracks.length} bài</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(pl.id);
              }}
              className="p-1.5 text-zinc-500 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
        {!playlists.length && (
          <li className="text-xs text-zinc-500 py-2">Chưa có playlist</li>
        )}
      </ul>
    </div>
  );
}
