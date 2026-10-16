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
