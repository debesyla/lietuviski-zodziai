// One-sentence readouts for research results. They restate values already on
// screen and name each source; they never add a measure or a combined score.
import { pluralLt } from './utils';

export type Readout = { figure: string; text: string };
export type RateRow = { label: string; value: number | null };

function formatRate(value: number) {
  return value.toLocaleString('lt-LT', { maximumFractionDigits: 2 });
}

function formatRatio(ratio: number) {
  return ratio.toLocaleString('lt-LT', { maximumFractionDigits: ratio >= 100 ? 0 : 1 });
}

/** "16,1 karto", but "8 kartus" and "10 kartų": decimals take the genitive singular. */
export function timesPhrase(ratio: number) {
  const formatted = formatRatio(ratio);
  if (formatted.includes(',')) return `${formatted} karto`;
  const whole = Math.round(ratio * (ratio >= 100 ? 1 : 10)) / (ratio >= 100 ? 1 : 10);
  return `${formatted} ${pluralLt(whole, ['kartą', 'kartus', 'kartų'])}`;
}

/** Ends a sentence once, so a place like "1990–2004 m." is not followed by a second full stop. */
function sentence(text: string) {
  return text.endsWith('.') ? text : `${text}.`;
}

/** Below this multiplier two rates read as "about the same". */
const SAME_RATE = 1.05;

/** Wartime-style contrast between two named sources, from log2(numerator / denominator). */
export function pairReadout(word: string, numerator: string, denominator: string, logRatio: number): Readout {
  const ratio = Math.pow(2, Math.abs(logRatio));
  if (ratio < SAME_RATE) {
    return { figure: '≈1×', text: `Šaltiniuose „${numerator}“ ir „${denominator}“ forma „${word}“ vartojama maždaug vienodai dažnai.` };
  }
  const direction = logRatio > 0 ? 'dažniau' : 'rečiau';
  return {
    figure: `${formatRatio(ratio)}×`,
    text: `Šaltinyje „${numerator}“ forma „${word}“ pavartota ${timesPhrase(ratio)} ${direction} nei šaltinyje „${denominator}“.`
  };
}

/**
 * Where a form is most and least frequent across the slices of one source.
 * `place` turns a slice label into a Lithuanian locative phrase. Rows without
 * a value were not observed and are left out rather than read as zero.
 */
export function spreadReadout(word: string, rows: RateRow[], place: (label: string) => string, verb: string): Readout | null {
  const observed = rows
    .filter((row): row is { label: string; value: number } => row.value !== null && row.value > 0)
    .sort((a, b) => b.value - a.value);
  const [top, runnerUp] = observed;
  const bottom = observed[observed.length - 1];
  if (!top) return null;
  if (observed.length === 1) {
    return { figure: formatRate(top.value), text: `Forma „${word}“ aptikta tik ${place(top.label)}: ${formatRate(top.value)} milijonui žodžių.` };
  }

  const ratio = top.value / bottom.value;
  if (ratio < SAME_RATE) {
    return { figure: '≈1×', text: `Forma „${word}“ visur ${verb} maždaug vienodai dažnai: apie ${formatRate(top.value)} milijonui žodžių.` };
  }
  let text = sentence(`Forma „${word}“ dažniausiai ${verb} ${place(top.label)} (${formatRate(top.value)} milijonui žodžių) – ${timesPhrase(ratio)} dažniau nei ${place(bottom.label)}`);
  if (observed.length > 2 && runnerUp.value / top.value >= 1 / SAME_RATE) {
    text += ` ${sentence(`Beveik tiek pat – ${place(runnerUp.label)}`)}`;
  }
  return { figure: `${formatRatio(ratio)}×`, text };
}
