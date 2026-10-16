import { replaceState } from '$app/navigation';

// Research pages share a one-word lookup as `?q=<word>`. The pages are
// prerendered, so the parameter is read from the address bar after hydration
// rather than from `page.url`, which is fixed at build time.
const QUERY_PARAM = 'q';

export function readWordQuery() {
  return new URLSearchParams(window.location.search).get(QUERY_PARAM)?.trim() ?? '';
}

export function writeWordQuery(value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_PARAM, value.trim());
  if (url.href !== window.location.href) replaceState(url, {});
}
