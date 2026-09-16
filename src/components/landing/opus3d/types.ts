export type OpusCategory = "film" | "music" | "code" | "chat" | "idle";

export interface CategoryVisual {
  id: OpusCategory;
  primary: string;
  secondary: string;
  noiseAmp: number;
  pulse: number;
  wireframe: number;
  bloom: number;
}

export const CATEGORY_VISUALS: Record<OpusCategory, CategoryVisual> = {
  idle: {
    id: "idle",
    primary: "#a855f7",
    secondary: "#f43f5e",
    noiseAmp: 0.18,
    pulse: 0.35,
    wireframe: 0,
    bloom: 0.4,
  },
  film: {
    id: "film",
    primary: "#f43f5e",
    secondary: "#fb923c",
    noiseAmp: 0.32,
    pulse: 0.2,
    wireframe: 0,
    bloom: 0.75,
  },
  music: {
    id: "music",
    primary: "#ec4899",
    secondary: "#3b82f6",
    noiseAmp: 0.22,
    pulse: 1.2,
    wireframe: 0.1,
    bloom: 0.55,
  },
  code: {
    id: "code",
    primary: "#06b6d4",
    secondary: "#10b981",
    noiseAmp: 0.12,
    pulse: 0.15,
    wireframe: 1,
    bloom: 0.35,
  },
  chat: {
    id: "chat",
    primary: "#6366f1",
    secondary: "#a855f7",
    noiseAmp: 0.45,
    pulse: 0.5,
    wireframe: 0,
    bloom: 0.6,
  },
};
