"use client";

import { useRef, useState } from "react";
import { ImagePlus, Paperclip, X } from "lucide-react";
import type { ChatAttachment } from "@/lib/chatStore";

function uid() {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function readFile(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith("image/");
      resolve({
        id: uid(),
        type: isImg ? "image" : "file",
        url: String(reader.result || ""),
        name: file.name,
        size: file.size,
        mime: file.type,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AttachmentBar({
  pending,
  setPending,
}: {
  pending: ChatAttachment[];
  setPending: (a: ChatAttachment[]) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setProgress(10);
    const list: ChatAttachment[] = [];
    const arr = Array.from(files).slice(0, 8);
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i];
      if (f.size > 4 * 1024 * 1024) continue; // 4MB limit dataURL
      list.push(await readFile(f));
      setProgress(Math.round(((i + 1) / arr.length) * 100));
    }
    setPending([...pending, ...list]);
    setTimeout(() => setProgress(0), 400);
  }

  return (
    <div className="space-y-2">
      {pending.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-1 py-1">
          {pending.map((a) => (
            <div key={a.id} className="relative shrink-0">
              {a.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px] text-zinc-400 px-1 text-center">
                  {(a.name || "file").slice(0, 12)}
                </div>
              )}
              <button
                type="button"
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center"
                onClick={() => setPending(pending.filter((x) => x.id !== a.id))}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {progress > 0 && progress < 100 && (
        <div className="h-1 rounded-full bg-neutral-800 overflow-hidden mx-1">
          <div className="h-full bg-rose-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex items-center gap-1">
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.zip"
          multiple
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => imgRef.current?.click()}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
          title="Ảnh"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
          title="Tệp"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
