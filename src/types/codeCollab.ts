/** Types — Opus Code collab & snippet hub */

export type SnippetCategory =
  | "canvas2d"
  | "particles"
  | "threejs"
  | "css"
  | "shader"
  | "python";

export interface SnippetItem {
  id: string;
  title: string;
  description: string;
  category: SnippetCategory;
  tags: string[];
  author: string;
  lang: "html" | "javascript" | "css" | "python" | "typescript";
  code: string;
  /** preview mode: html runs in iframe; canvas uses code as script */
  preview: "html" | "canvas" | "none";
  complexity: 1 | 2 | 3 | 4 | 5;
  likes: number;
  forks: number;
  lines: number;
}

export interface CursorPosition {
  line: number;
  column: number;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface CollabPeer {
  peerId: string;
  name: string;
  color: string;
  avatar?: string | null;
  cursor?: CursorPosition;
  lastSeen: number;
}

export interface CollabRoom {
  roomId: string;
  hostPeerId: string | null;
  peers: CollabPeer[];
  code: string;
  lang: string;
  createdAt: number;
  readOnlyGuest?: boolean;
}

export type PeerMessage =
  | { type: "hello"; name: string; color: string; avatar?: string | null }
  | { type: "code"; content: string; rev: number; fromId?: string }
  | { type: "cursor"; cursor: CursorPosition }
  | { type: "ping"; t: number }
  | { type: "pong"; t: number }
  | { type: "run"; mode?: string }
  | { type: "console"; line: string; kind?: "out" | "err" | "info" }
  | { type: "meta"; readOnlyGuest?: boolean };
