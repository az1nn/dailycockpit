import type { ProjectContext, RepositoryRef } from '../domain/project';

export type MutationKind = 'workspace.patch' | 'git.commit' | 'git.push' | 'github.merge';

export interface WorkspaceMetadata {
  root: string;
  name: string;
  isGitRepository: boolean;
}

export interface FileEntry {
  path: string;
  kind: 'file' | 'directory';
}

export interface GitStatus {
  branch: string;
  clean: boolean;
  changedPaths: string[];
  remoteUrl?: string;
  repositoryRoot: string;
}

export interface PullRequestSummary {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  head: string;
  base: string;
}

export interface WorkspaceService {
  open(path: string): Promise<WorkspaceMetadata>;
  listFiles(root: string, relative?: string): Promise<FileEntry[]>;
  readText(root: string, path: string): Promise<string>;
  applyPatch(root: string, patch: string, approvalToken: string): Promise<void>;
}

export interface GitService {
  status(root: string): Promise<GitStatus>;
  diff(root: string): Promise<string>;
  commit(root: string, message: string, approvalToken: string): Promise<string>;
  push(root: string, approvalToken: string): Promise<void>;
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
