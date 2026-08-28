"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavoritesStore } from "@/lib/favorites";
import { Trash2, Heart } from "lucide-react";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const remove = useFavoritesStore((s) => s.remove);
  const clear = useFavoritesStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-screen app-content-offset px-4" />;
  }

  return (
    <div className="min-h-screen app-content-offset pb-16 px-4 md:px-8 max-w-6xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" /> Yêu thích
        </h1>
        {favorites.length > 0 && (
          <button onClick={clear} className="text-sm text-zinc-400 hover:text-red-400">
            Xóa tất cả
          </button>
        )}
      </div>
      {favorites.length === 0 ? (
        <p className="text-zinc-500">Chưa có phim yêu thích.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {favorites.map((item) => (
            <div key={item.slug} className="relative group">
              <Link href={`/phim/${item.slug}`}>
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800">
                  <Image src={item.poster} alt={item.name} fill className="object-cover" unoptimized />
                </div>
                <h3 className="text-sm font-medium text-white mt-2 line-clamp-2">{item.name}</h3>
              </Link>
              <button
                onClick={() => remove(item.slug)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
