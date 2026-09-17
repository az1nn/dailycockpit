import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { demoAgentRuntime } from './agent/demoRuntime';
import type { ProjectContext, RepositoryRef } from './domain/project';
import type { AgentEvent, FileEntry, GitStatus, WorkspaceMetadata } from './platform/contracts';
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
    branch: status?.branch ?? 'not a Git repository',
    workspaceState: status ? (status.clean ? 'clean' : 'dirty') : 'unknown',
    repository: repositoryFromRemote(status?.remoteUrl),
    openPullRequests: 0,
  };
}

function viewTitle(view: View) {
  if (view === 'project') return 'Project context';
  if (view === 'changes') return 'Review changes';
  if (view === 'github') return 'GitHub workspace';
  return 'Agent workspace';
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
  const [input, setInput] = useState('');
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents);
  const [running, setRunning] = useState(false);

  const projectLabel = useMemo(() => {
    if (!project) return 'No project selected';
    if (project.repository) return `${project.repository.owner}/${project.repository.name}`;
    return project.workspaceRoot;
  }, [project]);

  async function loadProject(path: string) {
    const metadata = await nativeWorkspaceService.open(path);
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
        text: `Native project context loaded for ${nextProject.name}. Workspace and Git reads now come from Tauri.`,
      },
    ]);
  }

  async function openProject() {
    setOpening(true);
    setError(null);
    try {
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
          <strong>{project?.activeSpec ?? '002-native-project-context'}</strong>
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
              {opening ? 'Opening…' : project ? 'Open another' : 'Open project'}
            </button>
          </div>
        </section>

        {error && <div className="error-banner">{error}</div>}

        <section className="context-grid">
          <article className="panel file-panel">
            <div className="panel-title"><span>Project files</span><span>{files.length}</span></div>
            <div className="file-list">
              {files.length === 0 && <span className="file-list__empty">Open a project to inspect its root.</span>}
              {files.map((entry) => (
                <button type="button" key={entry.path} onClick={() => inspectFile(entry)} disabled={entry.kind === 'directory'}>
                  <span>{entry.kind === 'directory' ? '▸ ' : '· '}</span>{entry.path}
                </button>
              ))}
            </div>
          </article>

          <article className="panel editor-panel">
            <div className="panel-title"><span>{project?.name ?? 'Native context'}</span><span>{diffLabel}</span></div>

            {!project && (
              <div className="editor-copy empty-state">
                <span className="eyebrow">Wave 2</span>
                <h2>Attach the cockpit to a real project.</h2>
                <p>Choose a desktop workspace. Daily Cockpit will read its canonical path and Git state through the Tauri native boundary.</p>
                <button type="button" className="primary" onClick={openProject} disabled={opening}>Open project</button>
              </div>
            )}

            {project && view === 'project' && selectedFile && (
              <div className="native-content">
                <div className="content-toolbar">
                  <span>{selectedFile}</span>
                  <button type="button" className="command-button" onClick={() => setSelectedFile(null)}>Context</button>
                </div>
                <pre className="file-preview">{fileText}</pre>
              </div>
            )}

            {project && view === 'project' && !selectedFile && (
              <div className="editor-copy">
                <span className="eyebrow">Native project</span>
                <h2>{project.name}</h2>
                <p className="path-copy">{project.workspaceRoot}</p>
                <div className="metric-grid">
                  <div><span>Branch</span><strong>{project.branch}</strong></div>
                  <div><span>Workspace</span><strong>{project.workspaceState}</strong></div>
                  <div><span>Changes</span><strong>{gitStatus?.changedPaths.length ?? '—'}</strong></div>
                </div>
                <div className="guardrail">
                  <strong>Read-only native slice</strong>
                  <p>Filesystem listing/read and Git status/diff are live. Patch, commit, push and merge remain unavailable behind the mutation boundary.</p>
                </div>
              </div>
            )}

            {project && view === 'changes' && (
              <div className="native-content">
                <div className="content-toolbar">
                  <span>{gitStatus ? `${gitStatus.changedPaths.length} changed paths` : 'Not a Git repository'}</span>
                  <span>read-only</span>
                </div>
                {gitStatus && gitStatus.changedPaths.length > 0 && (
                  <div className="changed-paths">
                    {gitStatus.changedPaths.map((path) => <span key={path}>{path}</span>)}
                  </div>
                )}
                <pre className="diff-view">{gitStatus ? diff || 'Working tree is clean.' : 'Git is unavailable for this workspace.'}</pre>
              </div>
            )}

            {project && view === 'github' && (
              <div className="editor-copy empty-state">
                <span className="eyebrow">Next wave</span>
                <h2>GitHub remains outside this slice.</h2>
                <p>The local project identity is real now. Authentication, PR reads and checks arrive after SecretStore + OpenAI BYOK.</p>
              </div>
            )}

            {project && view === 'agent' && (
              <div className="editor-copy empty-state">
                <span className="eyebrow">Project-aware session</span>
                <h2>The agent now receives the real ProjectContext.</h2>
                <p>The runtime remains demonstrative until BYOK lands, but its project identity, branch and workspace state are no longer fixtures.</p>
              </div>
            )}
          </article>
        </section>
      </main>

      <aside className="agent-panel">
        <div className="agent-panel__header">
          <div><span className="eyebrow">Agent</span><strong>Project-aware session</strong></div>
          <span className="live-indicator">{project ? 'native context' : 'idle'}</span>
        </div>
        <div className="agent-stream">
          {events.map((event, index) => <EventCard event={event} key={`${event.type}-${index}`} />)}
          {running && <div className="thinking">Planning tools…</div>}
        </div>
        <form className="prompt-box" onSubmit={submit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={project ? 'Ask about this project…' : 'Open a project first…'}
            rows={3}
            disabled={!project}
          />
          <div className="prompt-actions">
            <span>{project ? 'Context: native project + spec' : 'No project context'}</span>
            <button type="submit" className="primary" disabled={running || !project || !input.trim()}>Run</button>
          </div>
        </form>
      </aside>

      <nav className="mobile-nav">
        {navigation.map((item) => (
          <button type="button" key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>
            <span>{item.glyph}</span>{item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
