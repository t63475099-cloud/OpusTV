/** Staged deployment & release notes */

export type DeployStatus =
  | "STAGED_PREVIEW"
  | "ACTIVE_PRODUCTION"
  | "SUPERSEDED"
  | "ROLLED_BACK";

export interface ChangelogGroups {
  features: string[];
  performance: string[];
  fixes: string[];
  security: string[];
}

export interface SystemDeployment {
  id: string;
  vercelDeploymentId: string;
  vercelUrl: string;
  gitCommitSha: string;
  gitBranch: string;
  buildDurationMs: number;
  status: DeployStatus;
  rawDeployMeta: Record<string, unknown>;
  createdAt: string;
  deployedAt: string | null;
  promotedAt: string | null;
}

export interface SystemReleaseNote {
  id: string;
  deploymentId: string;
  versionTag: string;
  title: string;
  generatedChangelog: ChangelogGroups;
  customizedMarkdown: string;
  isBroadcasted: boolean;
  publishedBy: string | null;
  publishedAt: string | null;
}

export interface DeploymentWithNotes extends SystemDeployment {
  releaseNote: SystemReleaseNote | null;
}

export const EMPTY_CHANGELOG: ChangelogGroups = {
  features: [],
  performance: [],
  fixes: [],
  security: [],
};
