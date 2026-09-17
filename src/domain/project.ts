export type WorkspaceState = 'clean' | 'dirty' | 'unknown';

export interface RepositoryRef {
  owner: string;
  name: string;
  remoteUrl?: string;
}

export interface ProjectContext {
  id: string;
  name: string;
  workspaceRoot: string;
  branch: string;
  workspaceState: WorkspaceState;
  repository?: RepositoryRef;
  openPullRequests: number;
  activeSpec?: string;
}
