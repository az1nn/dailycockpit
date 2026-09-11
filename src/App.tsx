import { FormEvent, useMemo, useState } from 'react';
import { demoAgentRuntime } from './agent/demoRuntime';
import { demoProject } from './domain/project';
import type { AgentEvent } from './platform/contracts';

type View = 'project' | 'changes' | 'github' | 'agent';

const navigation: Array<{ id: View; label: string; glyph: string }> = [
  { id: 'project', label: 'Project', glyph: '◇' },
  { id: 'changes', label: 'Changes', glyph: '±' },
  { id: 'github', label: 'GitHub', glyph: '◎' },
  { id: 'agent', label: 'Agent', glyph: '✦' },
];

const files = [
  '.specify/memory/constitution.md',
  'specs/001-project-agent-github-mvp/spec.md',
  'specs/001-project-agent-github-mvp/plan.md',
  'src/App.tsx',
  'src/platform/contracts.ts',
  'src-tauri/src/lib.rs',
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

export function App() {
  const [view, setView] = useState<View>('project');
  const [input, setInput] = useState('');
  const [events, setEvents] = useState<AgentEvent[]>([
    {
      type: 'message',
      text: 'Daily Cockpit is attached to this project. Ask about the repo, specs or the next implementation step.',
    },
  ]);
  const [running, setRunning] = useState(false);

  const projectLabel = useMemo(
    () => `${demoProject.repository?.owner}/${demoProject.repository?.name}`,
    [],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || running) return;

    setInput('');
    setRunning(true);
    setEvents((current) => [
      ...current,
      { type: 'message', text: `You: ${prompt}` },
    ]);

    for await (const agentEvent of demoAgentRuntime.run(prompt, demoProject)) {
      setEvents((current) => [...current, agentEvent]);
    }
    setRunning(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">DC</div>
        <div className="project-heading">
          <strong>{demoProject.name}</strong>
          <span>{projectLabel}</span>
        </div>
        <div className="repo-state">
          <span>{demoProject.branch}</span>
          <span className="status-dot" />
          <span>{demoProject.workspaceState}</span>
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
          <strong>{demoProject.activeSpec}</strong>
        </div>
      </aside>

      <main className="workbench">
        <section className="workbench-header">
          <div>
            <span className="eyebrow">{view}</span>
            <h1>{view === 'project' ? 'Project context' : view === 'changes' ? 'Review changes' : view === 'github' ? 'GitHub workspace' : 'Agent workspace'}</h1>
          </div>
          <button type="button" className="command-button">⌘K Command</button>
        </section>

        <section className="context-grid">
          <article className="panel file-panel">
            <div className="panel-title"><span>Project files</span><span>{files.length}</span></div>
            <div className="file-list">
              {files.map((file) => <button type="button" key={file}>{file}</button>)}
            </div>
          </article>

          <article className="panel editor-panel">
            <div className="panel-title"><span>MVP #1</span><span>spec-driven</span></div>
            <div className="editor-copy">
              <span className="eyebrow">Daily Cockpit</span>
              <h2>One project. One context. One operating surface.</h2>
              <p>
                The project becomes the unit of interaction. AI, workspace files, Git and GitHub are capabilities behind explicit interfaces instead of separate apps.
              </p>
              <div className="capability-row">
                <span>Workspace</span><span>Git</span><span>GitHub</span><span>Agent</span>
              </div>
              <div className="guardrail">
                <strong>Mutation guardrail</strong>
                <p>Read operations may run autonomously. Patch, commit, push and merge require approval.</p>
              </div>
            </div>
          </article>
        </section>
      </main>

      <aside className="agent-panel">
        <div className="agent-panel__header">
          <div><span className="eyebrow">Agent</span><strong>Project-aware session</strong></div>
          <span className="live-indicator">foundation</span>
        </div>
        <div className="agent-stream">
          {events.map((event, index) => <EventCard event={event} key={`${event.type}-${index}`} />)}
          {running && <div className="thinking">Planning tools…</div>}
        </div>
        <form className="prompt-box" onSubmit={submit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about this project…"
            rows={3}
          />
          <div className="prompt-actions">
            <span>Context: project + spec</span>
            <button type="submit" className="primary" disabled={running || !input.trim()}>Run</button>
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
