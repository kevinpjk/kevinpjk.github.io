import { esc, highlightPython } from '../types';
import type { DemoContext, DemoController, PaperDemo } from '../types';

/**
 * Codellaborator — proactive AI programming support.
 *
 * A live reconstruction of the interface in Figure 2 of the paper
 * (https://arxiv.org/abs/2502.18658): a chat panel beside an editor, an AI
 * agent with its own caret and status label, provenance highlighting on the
 * lines it authored, and a breakout conversation anchored to those lines.
 *
 * What runs automatically: Cody's caret travels to the stub method, selects
 * the two lines to replace, types the implementation character by character,
 * then opens a breakout chat about it.
 *
 * What the visitor can do: type in the side chat (Cody answers in the
 * breakout), edit any line of code directly, and push Cody's caret away by
 * moving the pointer into it.
 *
 * This is an illustrative reconstruction, not a recording, and it makes no
 * claim about measured outcomes. See the "Claims that must not appear on the
 * site" section of _new_material/website-update-brief.md.
 */

const INITIAL_LINES = [
  'class SchedulingSystemAPI:',
  '    def __init__(self):',
  '        self.events = []',
  '',
  '    def get_sorted_events(self):',
  '        # TODO: sort events by start time',
  '        pass',
];

/** Cody replaces the two-line stub body with this. */
const TARGET_LINE = '        return sorted(self.events, key=lambda e: e.start_time)';
/** Zero-based indices of the lines Cody selects and replaces. */
const EDIT_FROM = 5;
const EDIT_TO = 6;

const SIDE_CHAT_SEED = [
  { who: 'cody' as const, text: "I noticed get_sorted_events is still a stub. Want me to fill it in?" },
];

const BREAKOUT_SEED = [
  { who: 'cody' as const, text: "I implemented get_sorted_events. It returns the events sorted by start time. Want me to add a test next?" },
];

const REPLY = 'Sure thing! Let me do that for you.';

function lineMarkup(text: string, i: number): string {
  return `<div class="cd-line" data-line="${i}">
    <span class="cd-gutter" aria-hidden="true"><i class="cd-bp"></i>${i + 1}</span>
    <code class="cd-code" data-code="${i}" spellcheck="false">${highlightPython(text)}</code>
  </div>`;
}

function chatMarkup(msgs: { who: 'you' | 'cody'; text: string }[]): string {
  return msgs
    .map(m => `<div class="cd-msg cd-msg--${m.who}">
      <span class="cd-msg-who">${m.who === 'you' ? 'You' : 'Cody'}</span>
      <p class="cd-msg-text">${esc(m.text)}</p>
    </div>`)
    .join('');
}

function scene(): string {
  return `<div class="cd" data-cd>
  <div class="cd-topbar">
    <span class="cd-brand">Codellaborator</span>
    <span class="cd-tab">code.py</span>
  </div>

  <div class="cd-body">
    <aside class="cd-side">
      <div class="cd-side-log" data-side-log>${chatMarkup(SIDE_CHAT_SEED)}</div>
      <form class="cd-side-form" data-side-form>
        <label class="cd-sr" for="cd-side-input">Message Cody</label>
        <input class="cd-input" id="cd-side-input" data-side-input type="text"
               placeholder="Send a message…" autocomplete="off" />
        <button class="cd-send" type="submit" aria-label="Send message to Cody">
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M2 8l12-5.5L9 14l-1.5-5L2 8z" fill="currentColor"/>
          </svg>
        </button>
      </form>
    </aside>

    <div class="cd-editor" data-editor>
      <div class="cd-lines" data-lines>${INITIAL_LINES.map(lineMarkup).join('')}</div>

      <div class="cd-breakout" data-breakout hidden>
        <div class="cd-breakout-head">
          <span class="cd-breakout-title">Breakout &middot; line ${EDIT_FROM + 1}</span>
          <button class="cd-breakout-close" type="button" data-breakout-close
                  aria-label="Close breakout conversation">
            <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="cd-breakout-log" data-breakout-log></div>
        <form class="cd-breakout-form" data-breakout-form>
          <label class="cd-sr" for="cd-breakout-input">Reply to Cody in the breakout</label>
          <input class="cd-input" id="cd-breakout-input" data-breakout-input type="text"
                 placeholder="Reply…" autocomplete="off" />
          <button class="cd-send" type="submit" aria-label="Send reply to Cody">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="M2 8l12-5.5L9 14l-1.5-5L2 8z" fill="currentColor"/>
            </svg>
          </button>
        </form>
      </div>

      <i class="cd-connector cd-connector--v" data-connector-v aria-hidden="true"></i>
      <i class="cd-connector cd-connector--h" data-connector-h aria-hidden="true"></i>
      <i class="cd-caret" data-caret data-mode="dot" aria-hidden="true"><b class="cd-caret-label" data-caret-label>Cody</b></i>
    </div>
  </div>
</div>`;
}

function mount(root: HTMLElement, ctx: DemoContext): DemoController {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;

  const stage = q<HTMLElement>('[data-cd]');
  const editor = q<HTMLElement>('[data-editor]');
  const linesEl = q<HTMLElement>('[data-lines]');
  const caret = q<HTMLElement>('[data-caret]');
  const caretLabel = q<HTMLElement>('[data-caret-label]');
  const breakout = q<HTMLElement>('[data-breakout]');
  const breakoutLog = q<HTMLElement>('[data-breakout-log]');
  const sideLog = q<HTMLElement>('[data-side-log]');
  const sideForm = q<HTMLFormElement>('[data-side-form]');
  const sideInput = q<HTMLInputElement>('[data-side-input]');
  const breakoutForm = q<HTMLFormElement>('[data-breakout-form]');
  const breakoutInput = q<HTMLInputElement>('[data-breakout-input]');
  const connV = q<HTMLElement>('[data-connector-v]');
  const connH = q<HTMLElement>('[data-connector-h]');

  const aborter = new AbortController();
  const listen = { signal: aborter.signal };

  let lines = [...INITIAL_LINES];
  let timers: number[] = [];
  let running = false;
  let paused = false;
  let finished = false;
  let caretPos = { x: 0, y: 0 };

  const clearTimers = () => {
    timers.forEach(t => window.clearTimeout(t));
    timers = [];
  };

  /** setTimeout that respects pause and is cancelled by clearTimers/destroy. */
  const wait = (ms: number) =>
    new Promise<void>(resolve => {
      if (paused || aborter.signal.aborted) return;
      timers.push(window.setTimeout(resolve, ms));
    });

  // --- caret placement ----------------------------------------------------

  /** Pixel position of a character offset within a line, relative to editor. */
  function charPos(lineIndex: number, col: number) {
    const code = linesEl.querySelector<HTMLElement>(`[data-code="${lineIndex}"]`);
    const box = editor.getBoundingClientRect();
    if (!code) return { x: 0, y: 0 };

    const codeBox = code.getBoundingClientRect();
    const text = code.textContent ?? '';
    const clamped = Math.min(col, text.length);

    // Measure with a Range so the position is correct for any glyph widths.
    let x = codeBox.left;
    const node = code.firstChild;
    if (node && clamped > 0) {
      try {
        const range = document.createRange();
        range.setStart(code, 0);
        let counted = 0;
        let target: { node: Node; offset: number } | null = null;
        const walk = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
        let n: Node | null;
        while ((n = walk.nextNode())) {
          const len = n.textContent?.length ?? 0;
          if (counted + len >= clamped) {
            target = { node: n, offset: clamped - counted };
            break;
          }
          counted += len;
        }
        if (target) {
          range.setStart(target.node, target.offset);
          range.setEnd(target.node, target.offset);
          const r = range.getBoundingClientRect();
          if (r.left) x = r.left;
        }
      } catch {
        // Fall back to the line's left edge.
      }
    }

    return {
      x: x - box.left,
      y: codeBox.top - box.top + codeBox.height / 2,
    };
  }

  function placeCaret(x: number, y: number, animate = true) {
    caretPos = { x, y };
    caret.style.transitionDuration = animate && !ctx.reducedMotion ? '' : '0ms';
    caret.style.transform = `translate(${x}px, ${y}px)`;
    caret.dataset.visible = 'true';
  }

  /**
   * `dot` is Cody's resting presence — a small marker, no label.
   * `caret` is a text caret with its name attached, shown only while it is
   * actually working in the document.
   */
  function setCaretMode(mode: 'dot' | 'caret', label = 'Cody') {
    caret.dataset.mode = mode;
    caretLabel.textContent = label;
  }

  // --- rendering ----------------------------------------------------------

  function renderLine(i: number) {
    const code = linesEl.querySelector<HTMLElement>(`[data-code="${i}"]`);
    if (code) code.innerHTML = highlightPython(lines[i]);
  }

  function renderAll() {
    linesEl.innerHTML = lines.map(lineMarkup).join('');
    wireEditing();
  }

  function setSelection(from: number, to: number | null) {
    linesEl.querySelectorAll<HTMLElement>('.cd-line').forEach(el => {
      const i = Number(el.dataset.line);
      el.classList.toggle('is-sel', to !== null && i >= from && i <= to);
    });
  }

  function setProvenance(indices: number[]) {
    linesEl.querySelectorAll<HTMLElement>('.cd-line').forEach(el => {
      el.classList.toggle('is-ai', indices.includes(Number(el.dataset.line)));
    });
  }

  // --- editing ------------------------------------------------------------

  function wireEditing() {
    linesEl.querySelectorAll<HTMLElement>('.cd-code').forEach(code => {
      code.setAttribute('contenteditable', 'plaintext-only');
      // Firefox before 136 ignores plaintext-only; true still beats nothing.
      if (code.contentEditable !== 'plaintext-only') code.contentEditable = 'true';
      code.setAttribute('role', 'textbox');
      code.setAttribute('aria-label', `Line ${Number(code.dataset.code) + 1}, editable`);

      code.addEventListener('focus', () => {
        // Show plain text while editing so re-highlighting cannot move the caret.
        const i = Number(code.dataset.code);
        code.textContent = lines[i];
        stopIntro();
      }, listen);

      code.addEventListener('blur', () => {
        const i = Number(code.dataset.code);
        lines[i] = (code.textContent ?? '').replace(/\n/g, '');
        renderLine(i);
      }, listen);

      code.addEventListener('keydown', e => {
        // Keep it one line per row; Enter would split the DOM structure.
        if (e.key === 'Enter') e.preventDefault();
      }, listen);
    });
  }

  // --- chat ---------------------------------------------------------------

  function appendMsg(log: HTMLElement, who: 'you' | 'cody', text: string) {
    log.insertAdjacentHTML('beforeend', chatMarkup([{ who, text }]));
    log.scrollTop = log.scrollHeight;
  }

  function openBreakout(msgs: { who: 'you' | 'cody'; text: string }[]) {
    breakoutLog.innerHTML = chatMarkup(msgs);
    breakoutLog.scrollTop = breakoutLog.scrollHeight;

    // Unhide, force a reflow, then flip the open flag. Without the reflow both
    // happen in one frame and the browser has no start value to animate from,
    // so the panel would pop in rather than fade.
    breakout.hidden = false;
    void breakout.offsetHeight;
    breakout.dataset.open = 'true';

    const anchor = linesEl.querySelector<HTMLElement>(`[data-line="${EDIT_FROM}"]`);
    anchor?.classList.add('is-anchored');

    // Dotted elbow: down the gutter from the breakpoint, then across to the
    // panel's left edge. A single vertical segment stopped short of the panel,
    // which sits to the right, so the two never visibly connected.
    if (!anchor) return;

    requestAnimationFrame(() => {
      const box = editor.getBoundingClientRect();
      const lineBox = anchor.getBoundingClientRect();
      const panelBox = breakout.getBoundingClientRect();

      const lineY = lineBox.top - box.top + lineBox.height / 2;
      const panelY = panelBox.top - box.top;
      const panelX = panelBox.left - box.left;
      const gutterX = 11; // matches .cd-connector--v left offset

      const drop = panelY - lineY;
      if (drop <= 0 || panelX <= gutterX) return;

      connV.style.top = `${lineY}px`;
      connV.style.height = `${drop}px`;
      connH.style.top = `${panelY}px`;
      connH.style.left = `${gutterX}px`;
      connH.style.width = `${panelX - gutterX}px`;
      connV.dataset.visible = 'true';
      connH.dataset.visible = 'true';
    });
  }

  function closeBreakout() {
    breakout.dataset.open = 'false';
    // Let the fade finish before removing it from the layout.
    timers.push(window.setTimeout(() => { breakout.hidden = true; }, ctx.reducedMotion ? 0 : 260));
    linesEl.querySelectorAll('.cd-line.is-anchored')
      .forEach(el => el.classList.remove('is-anchored'));
    connV.dataset.visible = 'false';
    connH.dataset.visible = 'false';
  }

  // --- the automated intro ------------------------------------------------

  function stopIntro() {
    if (!running) return;
    clearTimers();
    running = false;
    ctx.setRunning(false);
  }

  async function runIntro() {
    if (aborter.signal.aborted) return;
    running = true;
    finished = false;
    ctx.setRunning(true);

    const settle = () => {
      running = false;
      finished = true;
      ctx.setRunning(false);
      setCaretMode('dot');
    };

    if (ctx.reducedMotion) {
      // No travel and no typing: show the end state immediately.
      lines[EDIT_FROM] = TARGET_LINE;
      lines.splice(EDIT_TO, 1);
      renderAll();
      setProvenance([EDIT_FROM]);
      const p = charPos(EDIT_FROM, TARGET_LINE.length);
      placeCaret(p.x, p.y, false);
      openBreakout(BREAKOUT_SEED);
      ctx.announce('Cody implemented get_sorted_events and opened a breakout conversation.');
      settle();
      return;
    }

    // 1. Caret travels to the stub.
    setCaretMode('caret', 'Thinking…');
    const start = charPos(EDIT_FROM, 8);
    placeCaret(start.x, start.y);
    ctx.announce('Cody is looking at get_sorted_events.');
    await wait(900);
    if (paused || aborter.signal.aborted) return;

    // 2. Select the two lines it intends to replace.
    setSelection(EDIT_FROM, EDIT_TO);
    ctx.announce('Cody selected the two stub lines.');
    await wait(850);
    if (paused || aborter.signal.aborted) return;

    // 3. Replace them with an empty line and type into it.
    setSelection(0, null);
    lines[EDIT_FROM] = '';
    lines.splice(EDIT_TO, 1);
    renderAll();
    setProvenance([EDIT_FROM]);
    setCaretMode('caret', 'writing…');

    for (let c = 1; c <= TARGET_LINE.length; c++) {
      if (paused || aborter.signal.aborted) return;
      lines[EDIT_FROM] = TARGET_LINE.slice(0, c);
      renderLine(EDIT_FROM);
      const p = charPos(EDIT_FROM, c);
      placeCaret(p.x, p.y, false);
      // Slightly uneven cadence reads as typing rather than a ticker.
      await wait(c % 7 === 0 ? 34 : 16);
    }
    if (paused || aborter.signal.aborted) return;

    renderLine(EDIT_FROM);
    ctx.announce('Cody wrote the implementation.');
    await wait(600);
    if (paused || aborter.signal.aborted) return;

    // 4. Open the breakout about what it just did.
    openBreakout(BREAKOUT_SEED);
    ctx.announce('Cody opened a breakout conversation about the change.');
    settle();

    // Provenance fades, as in the paper.
    timers.push(window.setTimeout(() => setProvenance([]), 5000));
  }

  // --- caret avoidance ----------------------------------------------------

  let dodgeCooldown = 0;

  editor.addEventListener('pointermove', e => {
    const box = editor.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    const dx = px - caretPos.x;
    const dy = py - caretPos.y;
    const dist = Math.hypot(dx, dy);

    const now = performance.now();
    if (dist > 52 || now < dodgeCooldown) return;
    dodgeCooldown = now + 420;

    // Push away along the approach vector, clamped inside the editor.
    const len = dist || 1;
    const pad = 28;
    const nx = Math.min(box.width - pad, Math.max(pad, caretPos.x - (dx / len) * 104));
    const ny = Math.min(box.height - pad, Math.max(pad, caretPos.y - (dy / len) * 74));
    placeCaret(nx, ny);
    setCaretMode('dot');
  }, listen);

  // --- side chat ----------------------------------------------------------

  sideForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = sideInput.value.trim();
    if (!text) return;

    stopIntro();
    sideInput.value = '';
    appendMsg(sideLog, 'you', text);
    setCaretMode('caret', 'working on it…');
    ctx.announce('Cody is working on it.');

    // Cody answers in the breakout, anchored to the code under discussion.
    timers.push(window.setTimeout(() => {
      openBreakout([...BREAKOUT_SEED, { who: 'you', text }, { who: 'cody', text: REPLY }]);
      ctx.announce(`Cody replied in the breakout: ${REPLY}`);
      setCaretMode('dot');
    }, ctx.reducedMotion ? 0 : 900));
  }, listen);

  // Replying inside the breakout keeps the conversation where the code is.
  breakoutForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = breakoutInput.value.trim();
    if (!text) return;

    stopIntro();
    breakoutInput.value = '';
    appendMsg(breakoutLog, 'you', text);
    setCaretMode('caret', 'working on it…');
    ctx.announce('Cody is working on it.');

    timers.push(window.setTimeout(() => {
      appendMsg(breakoutLog, 'cody', REPLY);
      ctx.announce(`Cody replied: ${REPLY}`);
      setCaretMode('dot');
    }, ctx.reducedMotion ? 0 : 900));
  }, listen);

  q<HTMLButtonElement>('[data-breakout-close]')
    .addEventListener('click', () => closeBreakout(), listen);

  // --- lifecycle ----------------------------------------------------------

  wireEditing();
  // Deliberately not started here: the loader calls play() when this demo
  // becomes the active one.

  return {
    play() {
      if (running || finished) return;
      paused = false;
      void runIntro();
    },
    reset() {
      clearTimers();
      paused = false;
      lines = [...INITIAL_LINES];
      renderAll();
      setSelection(0, null);
      setProvenance([]);
      closeBreakout();
      sideLog.innerHTML = chatMarkup(SIDE_CHAT_SEED);
      sideInput.value = '';
      breakoutInput.value = '';
      caret.dataset.visible = 'false';
      setCaretMode('dot');
      finished = false;
      ctx.announce('Demo reset.');
      void runIntro();
    },
    pause() {
      paused = true;
      stopIntro();
      setCaretMode('dot');
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (!finished) void runIntro();
    },
    destroy() {
      clearTimers();
      aborter.abort();
    },
  };
}

export const demo: PaperDemo = {
  id: 'codellaborator',
  stageLabel:
    'Reconstruction of the Codellaborator interface: a chat panel beside a Python editor, where an AI agent with its own caret implements a method and opens a conversation about it',
  hint: 'Live reconstruction — message Cody, edit the code, or move your pointer into Cody’s caret.',
  transcript: [
    'A chat panel sits beside a Python editor holding a SchedulingSystemAPI class whose get_sorted_events method is an empty stub.',
    'Cody, the proactive agent, moves its own caret to the stub and selects the two lines that make up its body.',
    'Cody replaces those lines, typing the implementation in as you watch. A provenance band marks the line as AI-authored and fades after five seconds, as it does in the paper.',
    'Cody then opens a breakout conversation anchored to that line, explaining what it wrote and asking whether to continue.',
    'You can send Cody a message from the side chat, and it answers in the breakout beside the code rather than away from it.',
    'Every line of code is editable, and moving your pointer into Cody’s caret makes it move aside.',
  ],
  scene,
  mount,
};
