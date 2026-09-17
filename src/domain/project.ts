export type WorkspaceState = 'clean' | 'dirty' | 'unknown';
export type WorkspaceKind = 'filesystem' | 'android-materialized';
export type WorkspaceAccessState =
  | 'available'
  | 'not-configured'
  | 'permission-lost'
  | 'source-missing'
  | 'unsupported';

export interface RepositoryRef {
  owner: string;
  name: string;
  remoteUrl?: string;
}

export interface ProjectContext {
  id: string;
  name: string;
  workspaceRoot: string;
  workspaceKind: WorkspaceKind;
  workspaceSourceUri?: string;
  workspaceAccessState: WorkspaceAccessState;
  branch: string;
  workspaceState: WorkspaceState;
  repository?: RepositoryRef;
  openPullRequests: number;
  activeSpec?: string;
}
