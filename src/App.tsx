import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { demoAgentRuntime } from './agent/demoRuntime';
import type { ProjectContext, RepositoryRef } from './domain/project';
import type {
  AgentEvent,
  FileEntry,
  GitStatus,
  WorkspaceMetadata,
  WorkspaceRuntime,
} from './platform/contracts';
import { nativeGitService, nativeWorkspaceService } from './platform/tauriAdapters';

type View = 'project' | 'changes' | 'github' | 'agent';

const navigation: Array<{ id: View; label: string; glyph: string }> = [
  { id: 'project', label: 'Project', glyph: '◇' },
  { id: 'changes', label: 'Changes', glyph: '±' },
  { id: 'github', label: 'GitHub', glyph: '◎' },
  { id: 'agent', label: 'Agent', glyph: '✦' },
];

const initialEvents: AgentEvent[] = [
  {
    type: 'message',
    text: 'Open a local project to attach the cockpit to real workspace and Git state.',
  },
];

function EventCard({ event }: { event: AgentEvent }) {
  if (event.type === 'done') return null;

  if (event.type === 'message') {
    return <div className="agent-message">{event.text}</div>;
  }

  const approval = event.type === 'approval-required';
  const call = event.call;

  return (
    <div className={`tool-card ${approval ? 'tool-card--approval' : ''}`}>
      <div className="tool-card__header">
        <span className="tool-name">{call.name}</span>
        <span className="tool-mode">{approval ? 'approval required' : 'read-only'}</span>
      </div>
      <p>{call.summary}</p>
      {approval && (
        <div className="approval-actions">
          <button type="button" disabled>Review patch</button>
          <button type="button" className="primary" disabled>Approve</button>
        </div>
      )}
    </div>
  );
}

function repositoryFromRemote(remoteUrl?: string): RepositoryRef | undefined {
  if (!remoteUrl) return undefined;
  const match = remoteUrl.match(/github\.com(?::|\/)([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) return undefined;

  return {
    owner: match[1],
    name: match[2],
    remoteUrl,
  };
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function buildProject(metadata: WorkspaceMetadata, status: GitStatus | null): ProjectContext {
  return {
    id: metadata.root,
    name: metadata.name,
    workspaceRoot: metadata.root,
    workspaceKind: metadata.kind,
    workspaceSourceUri: metadata.sourceUri,
    workspaceAccessState: metadata.accessState,
    branch: status?.branch ?? 'not a Git repository',
    workspaceState: status ? (status.clean ? 'clean' : 'dirty') : 'unknown',
    repository: repositoryFromRemote(status?.remoteUrl),
    openPullRequests: 0,
    activeSpec:
      metadata.kind === 'android-materialized'
        ? '003-android-workspace-storage'
        : '002-native-project-context',
  };
}

function viewTitle(view: View) {
  if (view === 'project') return 'Project context';
  if (view === 'changes') return 'Review changes';
  if (view === 'github') return 'GitHub workspace';
  return 'Agent workspace';
}

function restoreError(accessState: string) {
  if (accessState === 'permission-lost') {
    return 'Android workspace permission is no longer available. Reconnect the project source.';
  }
  if (accessState === 'source-missing') {
    return 'The Android workspace source is no longer available. Reconnect or import the project again.';
  }
  return `Android workspace is unavailable (${accessState}).`;
}

export function App() {
  const [view, setView] = useState<View>('project');
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [diff, setDiff] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileText, setFileText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [workspaceRuntime, setWorkspaceRuntime] = useState<WorkspaceRuntime | null>(null);
  const [input, setInput] = useState('');
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents);
  const [running, setRunning] = useState(false);

  const projectLabel = useMemo(() => {
    if (!project) return 'No project selected';
    if (project.repository) return `${project.repository.owner}/${project.repository.name}`;
    if (project.workspaceKind === 'android-materialized') return `${project.name} · Android working copy`;
    return project.workspaceRoot;
  }, [project]);

  async function loadWorkspaceMetadata(metadata: WorkspaceMetadata, message?: string) {
    const entries = await nativeWorkspaceService.listFiles(metadata.root);
    let status: GitStatus | null = null;
    let nextDiff = '';

    if (metadata.isGitRepository) {
      [status, nextDiff] = await Promise.all([
        nativeGitService.status(metadata.root),
        nativeGitService.diff(metadata.root),
      ]);
    }

    const nextProject = buildProject(metadata, status);
    setProject(nextProject);
    setFiles(entries);
    setGitStatus(status);
    setDiff(nextDiff);
    setSelectedFile(null);
    setFileText('');
    setEvents([
      {
        type: 'message',
        text:
          message ??
          `Native project context loaded for ${nextProject.name}. Workspace and Git reads now come from Tauri.`,
      },
    ]);
  }

  async function loadProject(path: string) {
    const metadata = await nativeWorkspaceService.open(path);
    await loadWorkspaceMetadata(metadata);
  }

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const runtime = await nativeWorkspaceService.runtime();
        if (!active) return;
        setWorkspaceRuntime(runtime);

        if (runtime !== 'android') return;

        const restored = await nativeWorkspaceService.restoreAndroid();
        if (!active) return;

        if (restored.metadata) {
          await loadWorkspaceMetadata(
            restored.metadata,
            `Android project ${restored.metadata.name} restored from persisted workspace access.`,
          );
          return;
        }

        if (restored.accessState !== 'not-configured') {
          setError(restoreError(restored.accessState));
        }
      } catch (reason) {
        if (active) setError(errorText(reason));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function openProject() {
    setOpening(true);
    setError(null);
    try {
      const runtime = workspaceRuntime ?? (await nativeWorkspaceService.runtime());
      setWorkspaceRuntime(runtime);

      if (runtime === 'android') {
        const metadata = await nativeWorkspaceService.openAndroid();
        await loadWorkspaceMetadata(
          metadata,
          `Android project ${metadata.name} imported into the app-owned working copy.`,
        );
        setView('project');
        return;
      }

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Open Daily Cockpit project',
      });
      if (!selected || Array.isArray(selected)) return;
      await loadProject(selected);
      setView('project');
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setOpening(false);
    }
  }

  async function refreshProject() {
    if (!project) return;
    setOpening(true);
    setError(null);
    try {
      if (project.workspaceKind === 'android-materialized') {
        const restored = await nativeWorkspaceService.restoreAndroid();
        if (!restored.metadata) {
          setProject(null);
          setFiles([]);
          setGitStatus(null);
          setDiff('');
          setError(restoreError(restored.accessState));
          return;
        }
        await loadWorkspaceMetadata(
          restored.metadata,
          `Android working copy refreshed from ${restored.metadata.name}.`,
        );
        return;
      }

      await loadProject(project.workspaceRoot);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setOpening(false);
    }
  }

  async function inspectFile(entry: FileEntry) {
    if (!project || entry.kind !== 'file') return;
    setError(null);
    try {
      const text = await nativeWorkspaceService.readText(project.workspaceRoot, entry.path);
      setSelectedFile(entry.path);
      setFileText(text);
      setView('project');
    } catch (reason) {
      setError(errorText(reason));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || running || !project) return;

    setInput('');
    setRunning(true);
    setEvents((current) => [
      ...current,
      { type: 'message', text: `You: ${prompt}` },
    ]);

    for await (const agentEvent of demoAgentRuntime.run(prompt, project)) {
      setEvents((current) => [...current, agentEvent]);
    }
    setRunning(false);
  }

  const stateLabel = project?.workspaceState ?? 'idle';
  const diffLabel = gitStatus
    ? gitStatus.clean
      ? 'clean'
      : `${gitStatus.changedPaths.length} changed`
    : 'Git unavailable';
  const defaultSpec = workspaceRuntime === 'android'
    ? '003-android-workspace-storage'
    : '002-native-project-context';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">DC</div>
        <div className="project-heading">
          <strong>{project?.name ?? 'Daily Cockpit'}</strong>
          <span>{projectLabel}</span>
        </div>
        <div className="repo-state">
          <span>{project?.branch ?? 'no branch'}</span>
          <span className={`status-dot ${project?.workspaceState === 'dirty' ? 'status-dot--dirty' : ''}`} />
          <span>{stateLabel}</span>
        </div>
      </header>

      <aside className="sidebar">
        <div className="nav-group">
          <span className="nav-caption">Workspace</span>
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={view === item.id ? 'nav-item nav-item--active' : 'nav-item'}
              onClick={() => setView(item.id)}
            >
              <span>{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="spec-chip">
          <span>Active spec</span>
          <strong>{project?.activeSpec ?? defaultSpec}</strong>
        </div>
      </aside>

      <main className="workbench">
        <section className="workbench-header">
          <div>
            <span className="eyebrow">{view}</span>
            <h1>{viewTitle(view)}</h1>
          </div>
          <div className="project-actions">
            {project && (
              <button type="button" className="command-button" onClick={refreshProject} disabled={opening}>
                Refresh
              </button>
            )}
            <button type="button" className="primary" onClick={openProject} disabled={opening}>
              {opening
                ? 'Opening…'
                : project
                  ? workspaceRuntime === 'android'
                    ? 'Reconnect project'
                    : 'Open another'
                  : workspaceRuntime === 'android'
                    ? 'Import project'
                    : 'Open project'}
            </button>
          </div>
        </section>

        {error && <div className="error-banner">{error}</div>}

        {!project && (
          <section className="empty-state">
            <span className="empty-glyph">◇</span>
            <h2>{workspaceRuntime === 'android' ? 'Import an Android project' : 'Open a project'}</h2>
            <p>
              {workspaceRuntime === 'android'
                ? 'Choose a project through Android storage access. Daily Cockpit keeps the source grant separate from its app-owned working copy.'
                : 'Choose a local workspace to load real filesystem and Git state through the native boundary.'}
            </p>
            <button type="button" className="primary" onClick={openProject} disabled={opening}>
              {opening ? 'Opening…' : workspaceRuntime === 'android' ? 'Choose project source' : 'Choose directory'}
            </button>
          </section>
        )}

        {project && view === 'project' && (
          <div className="project-grid">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Workspace</span>
                  <h2>Project files</h2>
                </div>
                <span className="badge">{files.length} entries</span>
              </div>
              {project.workspaceKind === 'android-materialized' && (
                <div className="workspace-note">
                  Android source access: <strong>{project.workspaceAccessState}</strong>. Git and file reads use the app-owned materialized working copy.
                </div>
              )}
              <div className="file-list">
                {files.map((entry) => (
                  <button
                    type="button"
                    key={entry.path}
                    className={selectedFile === entry.path ? 'file-row file-row--selected' : 'file-row'}
                    onClick={() => inspectFile(entry)}
                    disabled={entry.kind !== 'file'}
                  >
                    <span>{entry.kind === 'directory' ? '▸' : '·'}</span>
                    <span>{entry.path}</span>
                    <small>{entry.kind}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel preview-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Preview</span>
                  <h2>{selectedFile ?? 'Select a text file'}</h2>
                </div>
              </div>
              <pre className="file-preview">{fileText || 'UTF-8 text previews are read through the scoped native workspace boundary.'}</pre>
            </section>
          </div>
        )}

        {project && view === 'changes' && (
          <section className="panel changes-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">GitService</span>
                <h2>Working tree</h2>
              </div>
              <span className="badge">{diffLabel}</span>
            </div>
            {gitStatus ? (
              <>
                <div className="change-summary">
                  <span>branch: {gitStatus.branch}</span>
                  <span>{gitStatus.changedPaths.length} changed paths</span>
                </div>
                <pre className="diff-preview">{diff || 'Working tree is clean.'}</pre>
              </>
            ) : (
              <div className="empty-inline">This workspace is not a Git repository.</div>
            )}
          </section>
        )}

        {project && view === 'github' && (
          <section className="panel placeholder-panel">
            <span className="eyebrow">Next capability</span>
            <h2>GitHub auth and pull-request reads are intentionally not implemented yet.</h2>
            <p>The project and native Git boundaries land first. Remote authority comes in a later approval-scoped wave.</p>
          </section>
        )}

        {project && view === 'agent' && (
          <section className="agent-layout">
            <div className="agent-feed">
              {events.map((event, index) => (
                <EventCard key={`${event.type}-${index}`} event={event} />
              ))}
            </div>
            <form className="agent-composer" onSubmit={submit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the demo agent about this project…"
                rows={3}
              />
              <button type="submit" className="primary" disabled={running || !input.trim()}>
                {running ? 'Running…' : 'Run'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
