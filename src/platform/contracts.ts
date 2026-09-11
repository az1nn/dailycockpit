import type { ProjectContext, RepositoryRef } from '../domain/project';

export type MutationKind = 'workspace.patch' | 'git.commit' | 'git.push' | 'github.merge';

export interface FileEntry {
  path: string;
  kind: 'file' | 'directory';
}

export interface GitStatus {
  branch: string;
  clean: boolean;
  changedPaths: string[];
}

export interface PullRequestSummary {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  head: string;
  base: string;
}

export interface WorkspaceService {
  listFiles(root?: string): Promise<FileEntry[]>;
  readText(path: string): Promise<string>;
  applyPatch(patch: string, approvalToken: string): Promise<void>;
}

export interface GitService {
  status(): Promise<GitStatus>;
  diff(): Promise<string>;
  commit(message: string, approvalToken: string): Promise<string>;
  push(approvalToken: string): Promise<void>;
}

export interface GitHubService {
  listPullRequests(repository: RepositoryRef): Promise<PullRequestSummary[]>;
  createPullRequest(input: {
    repository: RepositoryRef;
    title: string;
    body: string;
    head: string;
    base: string;
  }, approvalToken: string): Promise<PullRequestSummary>;
}

export type AgentToolName =
  | 'workspace.list'
  | 'workspace.read'
  | 'workspace.patch'
  | 'git.status'
  | 'git.diff'
  | 'git.commit'
  | 'git.push'
  | 'github.pr.list'
  | 'github.pr.create'
  | 'github.pr.merge';

export interface AgentToolCall {
  id: string;
  name: AgentToolName;
  mutation: boolean;
  summary: string;
}

export type AgentEvent =
  | { type: 'message'; text: string }
  | { type: 'tool-planned'; call: AgentToolCall }
  | { type: 'approval-required'; call: AgentToolCall; mutation: MutationKind }
  | { type: 'done' };

export interface AgentRuntime {
  run(input: string, context: ProjectContext): AsyncIterable<AgentEvent>;
}
