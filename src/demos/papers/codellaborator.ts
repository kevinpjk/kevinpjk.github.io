import type { PaperDemo } from '../types';

/**
 * Codellaborator — proactive AI programming support.
 *
 * An authored condensation of the interface described in section 4 and
 * Figure 2 of the paper (https://arxiv.org/abs/2502.18658): a separate AI
 * caret, an activity/status indicator near the relevant code, provenance
 * highlighting on AI-authored lines, and a breakout conversation anchored to
 * the lines it discusses.
 *
 * This is an illustrative reconstruction, not a recording, and it makes no
 * claim about measured outcomes. See the "Claims that must not appear on the
 * site" section of _new_material/website-update-brief.md.
 */

interface Line {
  no: number;
  /** Pre-escaped markup. Authored literals only. */
  html: string;
  ai?: boolean;
}

const BASE: Line[] = [
  { no: 1, html: '<span class="tok-kw">def</span> <span class="tok-fn">average</span>(values):' },
  { no: 2, html: '    total = <span class="tok-fn">sum</span>(values)' },
  { no: 3, html: '    <span class="tok-kw">return</span> total / <span class="tok-fn">len</span>(values)' },
  { no: 4, html: '' },
];

const DOC: Line = {
  no: 2,
  html: '    <span class="tok-str">"""Return the mean."""</span>',
  ai: true,
};

/** Lines for a given step, renumbered after the docstring is inserted. */
function linesFor(index: number): Line[] {
  if (index < 2) return BASE;
  const [head, ...rest] = BASE;
  return [head, DOC, ...rest.map((l, i) => ({ ...l, no: i + 3 }))];
}

const STATUS = [
  { text: 'observing', tone: 'idle' },
  { text: 'considering this function', tone: 'busy' },
  { text: 'wrote 1 line', tone: 'done' },
  { text: 'ready', tone: 'idle' },
];

/** The right-hand panel: what the agent is doing, and why. */
const PANEL = [
  {
    label: 'Editor activity',
    body: 'You finish the function and move to a new line. Codellaborator watches editor activity for context rather than waiting to be prompted.',
  },
  {
    label: 'Agent presence · near line 1',
    body: 'A status indicator appears beside the function being considered, so the agent’s activity is visible and located rather than hidden.',
  },
  {
    label: 'Attributed edit · line 2',
    body: 'The agent adds a docstring. A separate caret and a provenance band mark the line as AI-authored, so ownership stays legible.',
  },
  {
    label: 'Breakout conversation · line 2',
    body: '<b>You</b> — why this change?<br><b>Cody</b> — the function had no docstring, so I described what it returns. The conversation stays anchored to the line it is about.',
  },
];

function render(index: number): string {
  const lines = linesFor(index);
  const status = STATUS[index];
  const panel = PANEL[index];
  const showCaret = index === 2;
  const showThread = index === 3;

  const code = lines
    .map(line => {
      const isAi = line.ai && index >= 2;
      return `<div class="cd-line${isAi ? ' is-ai' : ''}">
        <span class="cd-no" aria-hidden="true">${line.no}</span>
        <code class="cd-code">${line.html || '&nbsp;'}</code>
        ${isAi && showCaret ? '<span class="cd-caret" aria-hidden="true">Cody</span>' : ''}
      </div>`;
    })
    .join('');

  return `<div class="cd-editor">
      <div class="cd-bar">
        <span class="cd-file">analysis.py</span>
        <span class="cd-status cd-status--${status.tone}">
          <i class="cd-dot" aria-hidden="true"></i>Cody &middot; ${status.text}
        </span>
      </div>
      <div class="cd-code-area">${code}</div>
      ${showThread ? `<div class="cd-thread">
        <span class="cd-thread-anchor" aria-hidden="true"></span>
        <p class="cd-thread-body"><b>You</b> &mdash; why this change?</p>
        <p class="cd-thread-body cd-thread-body--ai"><b>Cody</b> &mdash; the function had no docstring, so I described what it returns.</p>
      </div>` : ''}
    </div>
    <div class="cd-panel">
      <span class="cd-panel-label">${panel.label}</span>
      <p class="cd-panel-body">${panel.body}</p>
    </div>`;
}

export const demo: PaperDemo = {
  id: 'codellaborator',
  stageLabel: 'Reconstructed code editor showing a proactive AI agent adding a docstring',
  steps: [
    {
      label: 'Your work',
      action: 'See what Cody does →',
      caption: 'You finish a function. Editor activity gives the agent its context.',
      duration: 2600,
    },
    {
      label: 'Agent presence',
      action: 'See the edit →',
      caption: 'A status indicator appears beside the code the agent is considering.',
      duration: 2800,
    },
    {
      label: 'Attributed edit',
      action: 'Ask why →',
      caption: 'The agent adds a docstring, marked with its own caret and a provenance band.',
      duration: 3400,
    },
    {
      label: 'Local context',
      action: 'Start again →',
      caption: 'The explanation stays anchored to the line it is about.',
    },
  ],
  transcript: [
    'You finish a Python function and move to a new line. Codellaborator reads editor activity for context instead of waiting to be prompted.',
    'A status indicator appears beside the function the agent is considering, so its activity is both visible and located.',
    'The agent adds a docstring to the function. A separate caret and a provenance band mark that line as AI-authored.',
    'You ask why the change was made. The reply stays anchored to the line it concerns, keeping the discussion in context.',
  ],
  render,
};
