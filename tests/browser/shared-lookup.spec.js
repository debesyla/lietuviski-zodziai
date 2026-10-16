import { expect, test } from '@playwright/test';

const pages = [
  { path: 'karo-zodziu-palyginimas', label: 'Žodžio forma', submit: 'Palyginti', shared: 'karas', result: /^karas$/i, next: 'taika' },
  { path: 'zanru-profilis', label: 'Tiksli žodžio forma', submit: 'Ieškoti', shared: 'ir', result: /^ir$/, next: 'mama' },
  { path: 'blkt-profilis', label: 'Viena žodžio forma', submit: 'Ieškoti', shared: 'žodis', result: /^žodis$/, next: 'ponas' },
  { path: 'sintakse', label: 'Lemos pradžia', submit: 'Ieškoti', shared: 'kalba', result: 'Sakinių kontekstai: kalba', next: 'žmogus' }
];

for (const { path, label, submit, shared, result, next } of pages) {
  test(`${path} opens a shared ?q= lookup and keeps new lookups in the URL`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(`${path}?q=${encodeURIComponent(shared)}`);
    await expect(page.getByRole('heading', { name: result })).toBeVisible();
    await expect(page.getByLabel(label)).toHaveValue(shared);

    await page.getByLabel(label).fill(next);
    await page.getByRole('button', { name: submit }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(next);
    expect(new URL(page.url()).pathname).toMatch(new RegExp(`/${path}/?$`));

    await page.reload();
    await expect(page.getByLabel(label)).toHaveValue(next);
    expect(pageErrors, 'uncaught page errors').toEqual([]);
  });
}
