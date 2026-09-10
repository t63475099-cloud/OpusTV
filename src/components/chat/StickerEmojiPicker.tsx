"use client";

import { useState } from "react";

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","😢","😭","😡","👍","👎","👏","🙏",
  "🔥","✨","💯","🎉","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","⭐","🌟","⚡",
];

const STICKERS = [
  "👋","🤝","💪","🫡","🙈","🙉","🙊","🐶","🐱","🐼","🦊","🐯","🌸","🍀","☕","🍕",
  "🎂","🎁","🎮","📱","💻","🚀","🌈","☀️","🌙","⭐","👻","🤖","👽","🦄","🐝","🦋",
];

export default function StickerEmojiPicker({
  onPickEmoji,
  onPickSticker,
}: {
  onPickEmoji: (e: string) => void;
  onPickSticker: (s: string) => void;
}) {
  const [tab, setTab] = useState<"emoji" | "sticker">("emoji");
  const items = tab === "emoji" ? EMOJIS : STICKERS;

  return (
    <div className="w-[min(92vw,300px)] rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
      <div className="flex border-b border-neutral-800">
        {(["emoji", "sticker"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 py-2 text-xs font-medium ${
              tab === k ? "text-white border-b-2 border-rose-500" : "text-zinc-500"
            }`}
          >
            {k === "emoji" ? "Emoji" : "Sticker"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto opus-chat-scroll custom-scroll">
        {items.map((e) => (
          <button
            key={e}
            type="button"
            className="text-xl p-1.5 rounded-lg hover:bg-white/10"
            onClick={() => (tab === "emoji" ? onPickEmoji(e) : onPickSticker(e))}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
