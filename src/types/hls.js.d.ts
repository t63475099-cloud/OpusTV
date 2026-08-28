declare module "hls.js" {
  export interface Level {
    height?: number;
    width?: number;
    bitrate?: number;
    name?: string;
    url?: string | string[];
  }

  export interface ManifestParsedData {
    levels: Level[];
    audioTracks?: unknown[];
    subtitleTracks?: unknown[];
  }

  export interface LevelSwitchedData {
    level: number;
  }

  export default class Hls {
    static isSupported(): boolean;
    static Events: {
      MANIFEST_PARSED: string;
      LEVEL_SWITCHED: string;
      ERROR: string;
    };

    constructor(config?: Record<string, unknown>);

    levels: Level[];
    currentLevel: number;
    autoLevelEnabled: boolean;
    loadSource(src: string): void;
    attachMedia(media: HTMLMediaElement): void;
    destroy(): void;

    on(
      event: string,
      callback: (event: string, data: ManifestParsedData & LevelSwitchedData & Record<string, unknown>) => void
    ): void;
  }
}
