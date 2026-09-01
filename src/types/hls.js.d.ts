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

  export interface ErrorData {
    type: string;
    details?: string;
    fatal: boolean;
    error?: Error;
  }

  export default class Hls {
    static isSupported(): boolean;
    static Events: {
      MANIFEST_PARSED: string;
      LEVEL_SWITCHED: string;
      ERROR: string;
    };
    static ErrorTypes: {
      NETWORK_ERROR: string;
      MEDIA_ERROR: string;
      KEY_SYSTEM_ERROR: string;
      MUX_ERROR: string;
      OTHER_ERROR: string;
    };

    constructor(config?: Record<string, unknown>);

    levels: Level[];
    currentLevel: number;
    autoLevelEnabled: boolean;
    loadSource(src: string): void;
    attachMedia(media: HTMLMediaElement): void;
    destroy(): void;
    startLoad(startPosition?: number): void;
    recoverMediaError(): void;

    on(
      event: string,
      callback: (
        event: string,
        data: ManifestParsedData & LevelSwitchedData & ErrorData & Record<string, unknown>
      ) => void
    ): void;
  }
}
