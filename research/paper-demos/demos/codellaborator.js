import { createPlayer } from '../player.js';

// All paper-specific states, captions, and rendering are in this file.
// Authored example, grounded in §4 of https://arxiv.org/html/2502.18658v1.
const steps = [
  { label: 'Your work', action: 'Finish the function →', caption: 'A finished code block gives Cody context for proactive assistance.', duration: 2800 },
  { label: 'Visible presence', action: 'See Cody’s edit →', caption: 'A thinking indicator makes the agent’s activity visible near the relevant code.', duration: 3000 },
  { label: 'Visible contribution', action: 'Inspect the context →', caption: 'Cody adds documentation. A separate caret and purple highlights show the AI’s contribution.', duration: 3800 },
  { label: 'Local context', action: 'Start again →', caption: 'An explanation stays attached to the changed lines, so you can inspect the contribution in context.' }
];

function render(index) {
  const status = ['observing', 'thinking…', 'writing code…', 'ready'][index];
  const lines = [
    '<span class="syntax">def</span> average(values):',
    ...(index >= 2 ? ['    """Return the arithmetic mean."""'] : []),
    '    total = sum(values)',
    '    <span class="syntax">return</span> total / len(values)',
    ' '
  ];
  const contexts = [
    ['Editor activity', 'You finish a function and move to a new line.'],
    ['Cody · thinking near this function', 'The editor activity prompts Cody to consider a contribution.'],
    ['AI contribution · line 2', 'Cody adds a docstring to the function you just finished.'],
    ['Breakout conversation · line 2', 'You: “Why this change?”<br>Cody: “I added a short docstring to explain what the function returns.”']
  ];
  return `<div class="editor-bar"><span>analysis.py</span><span class="presence">Cody · ${status}</span></div>
    <div class="editor-code" aria-label="Example Python function${index >= 2 ? ' with an AI-authored docstring on line 2' : ''}">
      ${lines.map((line, i) => `<div class="code-line ${index >= 2 && i === 1 ? 'ai-line' : ''}"><span class="line-no" aria-hidden="true">${i + 1}</span><code>${line}</code>${index === 2 && i === 1 ? '<span class="caret-tag" aria-hidden="true">Cody</span>' : ''}${i === lines.length - 1 ? '<span class="human-caret" aria-hidden="true">You</span>' : ''}</div>`).join('')}
    </div>
    <div class="context"><span class="context-label">${contexts[index][0]}</span><p>${contexts[index][1]}</p></div>`;
}

export const demo = {
  id: 'codellaborator',
  title: 'Codellaborator',
  eyebrow: 'CHI 2025 · Proactive AI',
  takeaway: 'See what your AI collaborator is doing, where it is working, and why.',
  paperTitle: 'Assistance or Disruption? Exploring and Evaluating the Design and Trade-offs of Proactive AI Programming Support',
  paperUrl: 'https://arxiv.org/abs/2502.18658',
  videoUrl: 'https://youtu.be/mI-jd-IjfE4',
  stageTitle: 'Inside the editor',
  transcript: [
    'You finish a Python function. Editor activity gives the proactive agent context.',
    'Cody shows a thinking status near the relevant code.',
    'Cody adds documentation. Its separate caret and purple highlights identify the AI’s contribution.',
    'You inspect an explanation attached to the changed lines. Local context keeps the discussion connected to the code.'
  ],
  steps,
  render
};

export function mount(root) { return createPlayer(root, demo); }
