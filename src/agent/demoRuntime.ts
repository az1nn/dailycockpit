import type { AgentEvent, AgentRuntime } from '../platform/contracts';

async function pause(milliseconds: number) {
  await new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export const demoAgentRuntime: AgentRuntime = {
  async *run(input, context): AsyncIterable<AgentEvent> {
    yield {
      type: 'message',
      text: `Project context loaded: ${context.name} on ${context.branch}.`,
    };

    await pause(180);

    yield {
      type: 'tool-planned',
      call: {
        id: crypto.randomUUID(),
        name: 'git.status',
        mutation: false,
        summary: 'Inspect the current Git status before deciding what to change.',
      },
    };

    await pause(180);

    yield {
      type: 'tool-planned',
      call: {
        id: crypto.randomUUID(),
        name: 'workspace.read',
        mutation: false,
        summary: 'Read project specs and relevant source files.',
      },
    };

    await pause(180);

    const asksForChange = /fix|implement|change|create|corrig|implement|alter|crie/i.test(input);

    if (asksForChange) {
      const call = {
        id: crypto.randomUUID(),
        name: 'workspace.patch' as const,
        mutation: true,
        summary: 'Prepare a patch, but require explicit approval before applying it.',
      };
      yield { type: 'tool-planned', call };
      yield { type: 'approval-required', call, mutation: 'workspace.patch' };
    } else {
      yield {
        type: 'message',
        text: 'This foundation runtime currently demonstrates context and tool planning. Native adapters and the OpenAI provider are the next slices.',
      };
    }

    yield { type: 'done' };
  },
};
