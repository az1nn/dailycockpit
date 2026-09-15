import { invoke } from '@tauri-apps/api/core';
import type {
  GitService,
  GitStatus,
  WorkspaceMetadata,
  WorkspaceService,
  FileEntry,
} from './contracts';

function unavailableMutation(operation: string): never {
  throw new Error(`${operation} is approval-gated and is not implemented in the read-only native slice.`);
}

export const nativeWorkspaceService: WorkspaceService = {
  open(path: string) {
    return invoke<WorkspaceMetadata>('open_workspace', { path });
  },

  listFiles(root: string, relative?: string) {
    return invoke<FileEntry[]>('list_workspace_entries', {
      root,
      relative: relative ?? null,
    });
  },

  readText(root: string, path: string) {
    return invoke<string>('read_workspace_text', { root, path });
  },

  async applyPatch() {
    unavailableMutation('workspace.patch');
  },
};

export const nativeGitService: GitService = {
  status(root: string) {
    return invoke<GitStatus>('git_status', { root });
  },

  diff(root: string) {
    return invoke<string>('git_diff', { root });
  },

  async commit() {
    return unavailableMutation('git.commit');
  },

  async push() {
    unavailableMutation('git.push');
  },
};
