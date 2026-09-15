export type WorkspaceState = 'clean' | 'dirty' | 'unknown';

export interface RepositoryRef {
  owner: string;
  name: string;
  remoteUrl?: string;
}

export interface ProjectContext {
  id: string;
  name: string;
  branch: string;
  workspaceState: WorkspaceState;
  repository?: RepositoryRef;
  openPullRequests: number;
  activeSpec?: string;
}

export const demoProject: ProjectContext = {
  id: 'dailycockpit',
  name: 'Daily Cockpit',
  branch: 'feat/mvp-foundation',
  workspaceState: 'clean',
  repository: {
    owner: 'az1nn',
    name: 'dailycockpit',
    remoteUrl: 'https://github.com/az1nn/dailycockpit',
  },
  openPullRequests: 1,
  activeSpec: '001-project-agent-github-mvp',
};
