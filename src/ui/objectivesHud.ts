import { PUZZLE_REQUIRES, puzzleState, type PuzzleId } from '@/systems/puzzle/state';
import { DimensionId } from '@/types';

/**
 * Persistent mission panel (top-right). It makes the co-operative loop legible:
 * the CURRENT objective (what this dimension does vs. what to relay to the
 * other), and a live checklist of all eight puzzles that ticks off as they
 * solve — so progress is visible without hovering anything. Puzzle order is
 * taken from the dependency graph, which is a straight chain, so exactly one
 * puzzle is "current" at any time.
 */

interface Objective {
  title: string;
  alpha: string;
  beta: string;
}

const OBJECTIVES: Record<PuzzleId, Objective> = {
  'sync.frequency': {
    title: 'Calibrate the frequency',
    alpha: 'Click the bucket to LISTEN, then describe the drip rhythm to Beta.',
    beta: 'Arm the Audio Analyzer and tap the rhythm Alpha describes.',
  },
  'sync.starmap': {
    title: 'Align the star map',
    alpha: 'Rotate the Stone Mural to the star sign Beta reads out.',
    beta: 'Read the decrypted Star Map’s sector to Alpha.',
  },
  'grid.chemical': {
    title: 'Identify the compound',
    alpha: 'Run the soil/pH strips and read each result to Beta.',
    beta: 'Cycle the Chemical Analyzer to the compound Alpha’s readings describe.',
  },
  'grid.bloom': {
    title: 'Cross the laser maze',
    alpha: 'Watch the flora: when the blooms open, wave Beta through that zone.',
    beta: 'Shift the laser spectrum until Alpha’s blooms open, then advance.',
  },
  'grid.server': {
    title: 'Breach the server',
    alpha: 'Open all the coolant valves to cool Beta’s server racks.',
    beta: 'Run the server hack once Alpha’s coolant is flowing.',
  },
  'core.anchor': {
    title: 'Derive the anchor code',
    alpha: 'Read the whiteboard equations aloud to Beta.',
    beta: 'Lock the matching anchor constant on the dilation charts.',
  },
  'core.mirrors': {
    title: 'Align the mirrors',
    alpha: 'Winch exactly the heavy mirrors Beta calls out toward the core.',
    beta: 'Read the terminal for which mirrors to align, and tell Alpha.',
  },
  'core.lever': {
    title: 'Escape together',
    alpha: 'Both grab the manual lever and pull on a shared “3, 2, 1!”',
    beta: 'Both grab the manual lever and pull on a shared “3, 2, 1!”',
  },
};

const ORDER = Object.keys(PUZZLE_REQUIRES) as PuzzleId[];

const panel = document.createElement('div');
panel.style.cssText = [
  'position:fixed',
  'top:12px',
  'right:12px',
  'width:290px',
  'font:12px/1.5 ui-monospace,monospace',
  'color:#dff6ff',
  'background:rgba(0,10,14,0.72)',
  'border:1px solid rgba(46,220,255,0.35)',
  'padding:10px 12px',
  'border-radius:6px',
  'pointer-events:none',
  'z-index:11',
].join(';');
document.body.appendChild(panel);

let dimension: DimensionId = DimensionId.Alpha;

function render(): void {
  const solvedCount = ORDER.filter((id) => puzzleState.isSolved(id)).length;
  const current = ORDER.find((id) => puzzleState.isAvailable(id) && !puzzleState.isSolved(id)) ?? null;

  const header = `<div style="color:#8fecff;letter-spacing:0.12em;margin-bottom:6px">MISSION · ${solvedCount}/${ORDER.length}</div>`;

  let now = '';
  if (current) {
    const obj = OBJECTIVES[current];
    const isAlpha = dimension === DimensionId.Alpha;
    const youText = isAlpha ? obj.alpha : obj.beta;
    const otherText = isAlpha ? obj.beta : obj.alpha;
    const otherName = isAlpha ? 'Beta' : 'Alpha';
    now =
      `<div style="margin-bottom:8px">` +
      `<div style="color:#7cf9c9;margin-bottom:3px">▶ ${obj.title}</div>` +
      `<div style="color:#eaffff"><span style="color:#8fecff">You:</span> ${youText}</div>` +
      `<div style="color:#9fb8c4;margin-top:2px"><span style="color:#8fecff">${otherName}:</span> ${otherText}</div>` +
      `</div>`;
  } else {
    now = `<div style="color:#7cf9c9;margin-bottom:8px">▶ ESCAPED — the timelines have merged.</div>`;
  }

  const list = ORDER.map((id) => {
    const solved = puzzleState.isSolved(id);
    const isCurrent = id === current;
    const mark = solved ? '✓' : isCurrent ? '▶' : '○';
    const color = solved ? '#7cf9c9' : isCurrent ? '#eaffff' : '#5b7079';
    const strike = solved ? 'text-decoration:line-through;opacity:0.75' : '';
    return `<div style="color:${color};${strike}">${mark} ${OBJECTIVES[id].title}</div>`;
  }).join('');

  panel.innerHTML =
    header + now + `<div style="border-top:1px solid rgba(46,220,255,0.18);padding-top:6px">${list}</div>`;
}

window.addEventListener('dimension:change', (e) => {
  dimension = (e as CustomEvent<DimensionId>).detail;
  render();
});
puzzleState.onSolved(() => render());
render();
