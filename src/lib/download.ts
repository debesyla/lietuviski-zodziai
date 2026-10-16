import pkg from 'papaparse';

const { unparse } = pkg;

// Keep the Blob URL alive long enough for the browser to start its native
// download. Revoking it in the same task can cancel downloads in browsers
// that resolve the link asynchronously.
const BLOB_URL_REVOKE_DELAY_MS = 1_000;

export function saveFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_REVOKE_DELAY_MS);
}

export function saveJson(payload: unknown, filename: string) {
  saveFile(`${JSON.stringify(payload, null, 2)}\n`, filename, 'application/json');
}

export type CsvCell = string | number | null;

/**
 * A research result as CSV: `#` lines with the source, licence and query, then
 * one row per slice. A missing value stays an empty cell, never a zero.
 */
export function resultCsv(metadata: string[], fields: string[], rows: CsvCell[][]) {
  const lines = [...metadata, 'Tuščias langelis: neaptikta, o ne nulis', `Eksportuota: ${new Date().toISOString().slice(0, 10)}`];
  const table = unparse({ fields, data: rows.map((row) => row.map((cell) => cell ?? '')) }, { newline: '\r\n' });
  return `﻿${lines.map((line) => `# ${line}`).join('\r\n')}\r\n${table}`;
}

export function saveCsv(metadata: string[], fields: string[], rows: CsvCell[][], filename: string) {
  saveFile(resultCsv(metadata, fields, rows), filename, 'text/csv;charset=utf-8');
}
